# State address migration: wrapping the flat stack in a module means every
# resource's address changes from `foo.bar` to `module.this.foo.bar`. These
# `moved` blocks declare that rename so `terraform plan` shows "no changes"
# instead of a destroy+recreate.
#
# Safe to leave in place forever; they're idempotent. Can be removed once the
# state has been rewritten (after a successful apply).

moved {
  from = azurerm_resource_group.core
  to   = module.this.azurerm_resource_group.core
}

moved {
  from = azurerm_container_registry.main
  to   = module.this.azurerm_container_registry.main
}
