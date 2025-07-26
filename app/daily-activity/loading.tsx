import { Skeleton } from "@/components/ui/skeleton"

export default function DailyActivityLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="rounded-lg border">
        <div className="p-0">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="p-4"><Skeleton className="h-5 w-16" /></th>
                <th className="p-4"><Skeleton className="h-5 w-24" /></th>
                <th className="p-4"><Skeleton className="h-5 w-20" /></th>
                <th className="p-4"><Skeleton className="h-5 w-16" /></th>
                <th className="p-4"><Skeleton className="h-5 w-24" /></th>
                <th className="p-4"><Skeleton className="h-5 w-20" /></th>
              </tr>
            </thead>
            <tbody>
              {[...Array(10)].map((_, i) => (
                <tr key={i} className="border-b">
                  <td className="p-4"><Skeleton className="h-12 w-full" /></td>
                  <td className="p-4"><Skeleton className="h-12 w-full" /></td>
                  <td className="p-4"><Skeleton className="h-6 w-12 mx-auto" /></td>
                  <td className="p-4"><Skeleton className="h-6 w-12 mx-auto" /></td>
                  <td className="p-4"><Skeleton className="h-5 w-16 ml-auto" /></td>
                  <td className="p-4"><Skeleton className="h-5 w-16 ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}