import { cn } from "@/lib/utils"

/**
 * التنفيذ الوحيد للهيكل العظمي.
 * كان في المشروع ثلاثة: `animate-pulse bg-muted` هنا، و`.skeleton` بتدرّج
 * shimmer في globals.css، و`h-64 animate-pulse bg-card/50` مكتوباً يدوياً في
 * الصفحات — فبدا التحميل مختلفاً في كل شاشة.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-md bg-secondary/60",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[skeleton-sweep_1.6s_infinite] after:bg-gradient-to-r after:from-transparent after:via-foreground/10 after:to-transparent",
        className
      )}
      {...props}
    />
  )
}

/** صفّ من الهياكل بارتفاع موحّد — يستبدل `Array.from(...).map(<div animate-pulse/>)`. */
function SkeletonList({
  count = 5,
  className,
  itemClassName,
}: {
  count?: number
  className?: string
  itemClassName?: string
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className={cn("h-16 w-full", itemClassName)} />
      ))}
    </div>
  )
}

export { Skeleton, SkeletonList }
