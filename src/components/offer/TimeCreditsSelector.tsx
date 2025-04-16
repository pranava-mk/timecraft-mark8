
import { useState } from "react"
import { CreditCard } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover"

interface TimeCreditsSelectorProps {
  value: number[]
  onChange: (value: number[]) => void
  maxCredits: number
  timeBalance: number | null
  hasNoCredits: boolean
}

export const TimeCreditsSelector = ({ 
  value, 
  onChange, 
  maxCredits, 
  timeBalance, 
  hasNoCredits 
}: TimeCreditsSelectorProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start font-normal"
          disabled={hasNoCredits}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          {value[0]} Credit{value[0] !== 1 ? 's' : ''}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium">Select Time Credits</h4>
          <Slider
            value={value}
            onValueChange={onChange}
            min={1}
            max={maxCredits > 0 ? maxCredits : 1}
            step={1}
            className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
            disabled={hasNoCredits}
          />
          <div className="flex justify-between">
            <span className="text-xs text-muted-foreground">1 Credit</span>
            <span className="text-xs text-muted-foreground">{maxCredits > 0 ? maxCredits : 1} Credits</span>
          </div>
          <div className="mt-2 text-center text-sm text-muted-foreground">
            {value[0] > (timeBalance || 0) ? (
              <span className="text-destructive">Insufficient credits!</span>
            ) : (
              <span>You have {timeBalance || 0} credits available</span>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
