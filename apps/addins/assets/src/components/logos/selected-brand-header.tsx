interface SelectedBrandHeaderProps {
  entity: {
    name: string;
    icon: string;
  };
}

export function SelectedBrandHeader({ entity }: SelectedBrandHeaderProps) {
  return (
    <div className="flex w-full flex-row items-center justify-between border-b p-4">
      <div className="flex flex-row items-center gap-4">
        {entity.icon ? (
          <img
            src={entity.icon}
            alt={entity.name}
            className="h-20 w-20 rounded-sm object-contain"
          />
        ) : (
          <div className="h-20 w-20 rounded-sm bg-muted" />
        )}
        <h3 className="text-3xl font-semibold text-muted-foreground">{entity.name}</h3>
      </div>
    </div>
  );
}
