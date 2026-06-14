import Link from "next/link"

export default function Header() {
  return (
    <header className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-200 sticky top-0 bg-white z-10">
      <h1 className="text-xl font-bold">
        <Link href="/">AI News</Link>
      </h1>
      <div className="flex items-center gap-4">
        <Link href="/search" className="text-sm text-blue-600 hover:underline">
          AI検索
        </Link>
      </div>
    </header>
  )
}
