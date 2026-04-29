"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";

export default function BackToCarsLink() {
  const router = useRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (window.history.length > 1) {
      event.preventDefault();
      router.back();
    }
  };

  return (
    <Link href="/cars" onClick={handleClick} className="text-sm text-[#55556a] hover:text-white">
      ← Cars
    </Link>
  );
}