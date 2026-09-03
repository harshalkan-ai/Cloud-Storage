import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-[#1a73e8] text-white shadow-sm hover:bg-[#1557b0] hover:shadow active:scale-[0.99]',
        destructive:
          'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
        outline:
          'border border-[#dadce0] bg-white text-[#3c4043] hover:bg-[#f8f9fa] hover:text-[#202124]',
        secondary:
          'bg-[#f1f3f4] text-[#3c4043] hover:bg-[#e8eaed] hover:text-[#202124]',
        ghost: 'text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#202124]',
        link: 'text-[#1a73e8] underline-offset-4 hover:underline',
        googlePill:
          'bg-white border border-[#dadce0] text-[#3c4043] shadow-md hover:bg-[#f8fafd] hover:shadow-lg rounded-2xl px-5 py-3 text-sm font-semibold text-[#1f1f1f]',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-11 rounded-xl px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
