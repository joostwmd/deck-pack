export async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result?.toString().split(",")[1] as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
