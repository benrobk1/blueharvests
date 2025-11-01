import { Button, ButtonProps } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
}

export const LoadingButton = ({ 
  isLoading, 
  loadingText,
  children, 
  disabled,
  className,
  ...props 
}: LoadingButtonProps) => {
  return (
    <Button 
      disabled={isLoading || disabled} 
      className={cn(
        "transition-all duration-200",
        !disabled && !isLoading && "hover:scale-105",
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner size={16} className="mr-2" />
          {loadingText || "Processing..."}
        </>
      ) : (
        children
      )}
    </Button>
  );
};
