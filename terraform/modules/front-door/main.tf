########################################################################
# Azure Front Door Standard                                             #
#                                                                       #
# Layout:                                                               #
#   - One profile (shared, pays ~€30/mo base; endpoints are free)       #
#   - Two endpoints under that profile: OPS and API                     #
#   - Two origin groups, each pointing at its App Service web app       #
#   - One WAF policy (DefaultRuleSet), associated with both endpoints   #
#                                                                       #
# We intentionally do NOT use custom domains here: the auto-generated   #
# *.z01.azurefd.net hostnames come with valid TLS out of the box, which #
# is sufficient until a real domain is purchased.                       #
########################################################################

resource "azurerm_cdn_frontdoor_profile" "main" {
  name                = var.profile_name
  resource_group_name = var.resource_group_name
  sku_name            = "Standard_AzureFrontDoor"
  tags                = var.tags

  # AFD profile creation is rate-limited + slow (~5 min). We treat it as a
  # long-lived foundational resource; once it exists we never recreate it.
  lifecycle {
    prevent_destroy = true
  }
}

########################################################################
# Endpoint: OPS frontend                                                #
########################################################################

resource "azurerm_cdn_frontdoor_endpoint" "ops" {
  name                     = "ops-${var.endpoint_suffix}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id
  enabled                  = true
  tags                     = var.tags
}

resource "azurerm_cdn_frontdoor_origin_group" "ops" {
  name                     = "og-ops"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id
  session_affinity_enabled = false

  # Latency-based load balancing will kick in naturally once we add more
  # origins for multi-region. For a single origin these values are fine.
  load_balancing {
    additional_latency_in_milliseconds = 50
    sample_size                        = 4
    successful_samples_required        = 3
  }

  # App Service responds to HEAD / with 200 (the Dockerfile's Caddy does
  # this for the SPA entry point), so we use that as a cheap liveness probe.
  health_probe {
    interval_in_seconds = 100
    path                = "/"
    protocol            = "Https"
    request_type        = "HEAD"
  }
}

resource "azurerm_cdn_frontdoor_origin" "ops_primary" {
  name                           = "o-ops-primary"
  cdn_frontdoor_origin_group_id  = azurerm_cdn_frontdoor_origin_group.ops.id
  enabled                        = true
  host_name                      = var.ops_origin_hostname
  http_port                      = 80
  https_port                     = 443
  # Must match host_name so App Service's SNI cert validation passes (the
  # cert on *.azurewebsites.net is bound to the literal hostname).
  origin_host_header             = var.ops_origin_hostname
  priority                       = 1
  weight                         = 1000
  certificate_name_check_enabled = true
}

resource "azurerm_cdn_frontdoor_route" "ops" {
  name                          = "route-ops"
  cdn_frontdoor_endpoint_id     = azurerm_cdn_frontdoor_endpoint.ops.id
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.ops.id
  cdn_frontdoor_origin_ids      = [azurerm_cdn_frontdoor_origin.ops_primary.id]
  enabled                       = true

  forwarding_protocol    = "HttpsOnly"
  https_redirect_enabled = true
  patterns_to_match      = ["/*"]
  supported_protocols    = ["Http", "Https"]
  link_to_default_domain = true

  # SPA bundle is fingerprinted, so caching is safe. The index.html inside
  # the Caddy container sets short cache headers anyway, which AFD respects.
  cache {
    query_string_caching_behavior = "IgnoreQueryString"
    compression_enabled           = true
    content_types_to_compress = [
      "text/html",
      "text/css",
      "text/javascript",
      "application/javascript",
      "application/json",
      "image/svg+xml",
    ]
  }
}

########################################################################
# Endpoint: API backend                                                 #
########################################################################

resource "azurerm_cdn_frontdoor_endpoint" "api" {
  name                     = "api-${var.endpoint_suffix}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id
  enabled                  = true
  tags                     = var.tags
}

resource "azurerm_cdn_frontdoor_origin_group" "api" {
  name                     = "og-api"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id
  session_affinity_enabled = false

  load_balancing {
    additional_latency_in_milliseconds = 50
    sample_size                        = 4
    successful_samples_required        = 3
  }

  # Hono's /healthz returns {status:"ok"} quickly and has no DB dependency,
  # so it is the right target for an origin-level probe. /readyz would also
  # fail if Postgres is slow, which would flap the origin out of rotation.
  health_probe {
    interval_in_seconds = 100
    path                = "/healthz"
    protocol            = "Https"
    request_type        = "GET"
  }
}

resource "azurerm_cdn_frontdoor_origin" "api_primary" {
  name                           = "o-api-primary"
  cdn_frontdoor_origin_group_id  = azurerm_cdn_frontdoor_origin_group.api.id
  enabled                        = true
  host_name                      = var.api_origin_hostname
  http_port                      = 80
  https_port                     = 443
  origin_host_header             = var.api_origin_hostname
  priority                       = 1
  weight                         = 1000
  certificate_name_check_enabled = true
}

resource "azurerm_cdn_frontdoor_route" "api" {
  name                          = "route-api"
  cdn_frontdoor_endpoint_id     = azurerm_cdn_frontdoor_endpoint.api.id
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.api.id
  cdn_frontdoor_origin_ids      = [azurerm_cdn_frontdoor_origin.api_primary.id]
  enabled                       = true

  forwarding_protocol    = "HttpsOnly"
  https_redirect_enabled = true
  patterns_to_match      = ["/*"]
  supported_protocols    = ["Http", "Https"]
  link_to_default_domain = true

  # API responses are per-user (auth) and non-idempotent (tRPC mutations).
  # Disabling the cache for the entire API endpoint is the only safe default;
  # callers can selectively cache public GETs later via a rule set.
  cache {
    query_string_caching_behavior = "UseQueryString"
    compression_enabled           = true
    content_types_to_compress     = ["application/json", "text/plain"]
  }
}

########################################################################
# WAF policy + security policy                                          #
#                                                                       #
# The security_policy is what actually wires the WAF to the endpoints.  #
# One policy can associate the same WAF with many domains/endpoints so  #
# we don't need one per endpoint.                                       #
########################################################################

########################################################################
# WAF policy                                                            #
#                                                                       #
# IMPORTANT: Managed rule sets (DefaultRuleSet, BotManager, etc.) are   #
# Premium-only. On Standard we can only author custom rules. The two    #
# below still cover the majority of real-world automated abuse traffic: #
#                                                                       #
#   1. Rate limiting — 100 req/min/IP. Blunts credential stuffing,      #
#      content-scraping bots, and toy DoS without affecting humans.     #
#   2. Scanner path block — returns 403 for the usual suspects          #
#      (/wp-admin, /.env, /phpmyadmin, …) so noise never even reaches   #
#      the origin. Reduces App Service CPU + log volume noticeably.     #
#                                                                       #
# Move to Premium if the project ever justifies managed rule sets.      #
########################################################################

resource "azurerm_cdn_frontdoor_firewall_policy" "main" {
  name                = replace("${var.profile_name}waf", "-", "")
  resource_group_name = var.resource_group_name
  sku_name            = azurerm_cdn_frontdoor_profile.main.sku_name
  enabled             = true
  mode                = var.waf_mode

  # Per-IP rate limit. Hit the threshold inside the window and every
  # subsequent request within `rate_limit_duration_in_minutes` is blocked.
  custom_rule {
    name                           = "RateLimitPerIP"
    enabled                        = true
    priority                       = 1
    rate_limit_duration_in_minutes = 1
    rate_limit_threshold           = var.rate_limit_threshold_per_minute
    type                           = "RateLimitRule"
    action                         = "Block"

    # RateLimitRule needs *some* match condition to scope the limit. Matching
    # on RequestUri + any string effectively rate-limits everything: the
    # condition is trivially true for all requests.
    match_condition {
      match_variable     = "RequestUri"
      operator           = "Contains"
      negation_condition = false
      match_values       = ["/"]
    }
  }

  # Scanner tarpit. One MatchRule with multiple path prefixes; priority is
  # higher than the rate limit so scanner hits don't count toward the quota.
  custom_rule {
    name     = "BlockScannerPaths"
    enabled  = true
    priority = 10
    type     = "MatchRule"
    action   = "Block"

    match_condition {
      match_variable     = "RequestUri"
      operator           = "Contains"
      negation_condition = false
      transforms         = ["Lowercase"]
      match_values = [
        "/wp-admin",
        "/wp-login",
        "/wordpress",
        "/xmlrpc.php",
        "/.env",
        "/phpmyadmin",
        "/phpinfo",
        "/.git/",
        "/.aws/",
        "/server-status",
      ]
    }
  }

  tags = var.tags
}

resource "azurerm_cdn_frontdoor_security_policy" "main" {
  name                     = "secpol-${var.endpoint_suffix}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id

  security_policies {
    firewall {
      cdn_frontdoor_firewall_policy_id = azurerm_cdn_frontdoor_firewall_policy.main.id

      association {
        domain {
          cdn_frontdoor_domain_id = azurerm_cdn_frontdoor_endpoint.ops.id
        }
        domain {
          cdn_frontdoor_domain_id = azurerm_cdn_frontdoor_endpoint.api.id
        }
        patterns_to_match = ["/*"]
      }
    }
  }
}
