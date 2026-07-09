interface ScreenHeaderProps {
  title: string;
  text: string;
}

export function ScreenHeader({ title, text }: ScreenHeaderProps) {
  return (
    <div className="flex flex-col border-b px-2 py-4">
      <h3 className="text-2xl font-bold">{title}</h3>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
