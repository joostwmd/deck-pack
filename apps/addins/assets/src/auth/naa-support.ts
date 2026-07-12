/** Whether the current Office host supports Nested App Authentication (MSAL NAA). */
export function isNaaSupported(): boolean {
  const office = (window as Window & { Office?: typeof Office }).Office;

  if (!office?.context?.requirements?.isSetSupported) {
    return false;
  }

  return office.context.requirements.isSetSupported("NestedAppAuth", "1.1");
}
