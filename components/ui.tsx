import { ComponentChildren, JSX } from "preact";
import { forwardRef } from "preact/compat";

interface ButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  class?: string;
  disabled?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { class: className, variant = "default", size = "default", ...props },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-95";

    const variants = {
      default: "bg-primary text-primary-foreground shadow-lg shadow-primary/10 hover:bg-primary/90",
      destructive:
        "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
      outline:
        "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
    };

    const sizes = {
      default: "h-10 px-5 py-2",
      sm: "h-9 rounded-lg px-4 text-xs",
      lg: "h-12 rounded-2xl px-10 text-base",
      icon: "h-10 w-10",
    };

    const combinedStyles = `${baseStyles} ${variants[variant]} ${sizes[size]} ${
      className || ""
    }`;

    return <button ref={ref} class={combinedStyles} {...props} />;
  },
);

export const Card = (
  { children, class: className }: {
    children: ComponentChildren;
    class?: string;
  },
) => (
  <div
    class={`rounded-2xl border bg-card text-card-foreground shadow-sm transition-all ${
      className || ""
    }`}
  >
    {children}
  </div>
);

export const CardHeader = (
  { children, class: className }: {
    children: ComponentChildren;
    class?: string;
  },
) => (
  <div class={`flex flex-col space-y-1.5 p-6 ${className || ""}`}>
    {children}
  </div>
);

export const CardTitle = (
  { children, class: className }: {
    children: ComponentChildren;
    class?: string;
  },
) => (
  <h3
    class={`font-semibold leading-none tracking-tight text-xl ${
      className || ""
    }`}
  >
    {children}
  </h3>
);

export const CardDescription = (
  { children, class: className }: {
    children: ComponentChildren;
    class?: string;
  },
) => (
  <p class={`text-sm text-muted-foreground ${className || ""}`}>
    {children}
  </p>
);

export const CardContent = (
  { children, class: className }: {
    children: ComponentChildren;
    class?: string;
  },
) => (
  <div class={`p-6 pt-0 ${className || ""}`}>
    {children}
  </div>
);

export const Input = ({ class: className, ...props }: JSX.HTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    class={`flex h-10 w-full rounded-xl border border-input bg-transparent px-4 py-1 text-sm shadow-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
      className || ""
    }`}
  />
);

export const Badge = (
  { children, variant = "default", class: className }: {
    children: ComponentChildren;
    variant?: "default" | "secondary" | "destructive" | "outline";
    class?: string;
  },
) => {
  const variants = {
    default: "bg-primary text-primary-foreground border-transparent shadow",
    secondary: "bg-secondary text-secondary-foreground border-transparent",
    destructive:
      "bg-destructive text-destructive-foreground border-transparent shadow-sm",
    outline: "text-foreground border-border",
  };
  return (
    <div
      class={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold transition-all w-fit ${
        variants[variant]
      } ${className || ""}`}
    >
      {children}
    </div>
  );
};

export const Table = ({ children, class: className }: { children: ComponentChildren; class?: string }) => (
  <div class="relative w-full overflow-auto">
    <table class={`w-full caption-bottom text-sm ${className || ""}`}>
      {children}
    </table>
  </div>
);

export const TableHeader = ({ children, class: className }: { children: ComponentChildren; class?: string }) => (
  <thead class={`[&_tr]:border-b ${className || ""}`}>
    {children}
  </thead>
);

export const TableBody = ({ children, class: className }: { children: ComponentChildren; class?: string }) => (
  <tbody class={`[&_tr:last-child]:border-0 ${className || ""}`}>
    {children}
  </tbody>
);

export const TableRow = ({ children, class: className }: { children: ComponentChildren; class?: string }) => (
  <tr class={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className || ""}`}>
    {children}
  </tr>
);

export const TableHead = ({ children, class: className }: { children: ComponentChildren; class?: string }) => (
  <th class={`h-10 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className || ""}`}>
    {children}
  </th>
);

export const TableCell = ({ children, class: className }: { children: ComponentChildren; class?: string }) => (
  <td class={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className || ""}`}>
    {children}
  </td>
);
