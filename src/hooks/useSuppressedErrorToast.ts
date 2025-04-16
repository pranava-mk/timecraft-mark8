
import { useToast } from "@/components/ui/use-toast"

// This hook wraps the standard toast functionality but suppresses error toasts
export function useSuppressedErrorToast() {
  const standardToast = useToast()
  
  // Create a wrapper function that doesn't show error variants
  const suppressedToast = {
    ...standardToast,
    toast: (props: any) => {
      // Only show toasts that are not error/destructive variants
      if (props.variant !== 'destructive') {
        return standardToast.toast(props)
      } else {
        // Log the error to console instead
        console.error("Suppressed error toast:", props.description || props.title)
        return { id: "suppressed-toast", dismiss: () => {} }
      }
    }
  }
  
  return suppressedToast
}
