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
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background cursor-pointer";

    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline:
        "border border-input hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "underline-offset-4 hover:underline text-primary",
    };

    const sizes = {
      default: "h-10 py-2 px-4",
      sm: "h-9 px-3 rounded-md",
      lg: "h-11 px-8 rounded-md",
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
    class={`rounded-xl border bg-card text-card-foreground shadow ${
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
    class={`flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
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
    default: "bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground",
  };
  return (
    <div
      class={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-fit ${
        variants[variant]
      } ${className || ""}`}
    >
      {children}
    </div>
  );
};
