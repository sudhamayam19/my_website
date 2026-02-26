"use client";

import { useEffect, useState } from "react";

export function ShareButtons() {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent("Check out this amazing post by Sudha Devarakonda!")}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`Check out this amazing post: ${url}`)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  };

  return (
    <div className="mt-12 border-t border-[#d8c8b0] pt-8">
      <h3 className="display-font mb-4 text-2xl font-bold text-[#1f2d39]">Share this post</h3>
      <div className="flex flex-wrap gap-3">
        <a
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-full border border-[#c8b397] bg-[#eef4f8] px-6 py-2 font-semibold text-[#2a4f76] transition-colors hover:bg-[#dfeaf3]"
        >
          Facebook
        </a>
        <a
          href={shareLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-full border border-[#c8b397] bg-[#e9f4fa] px-6 py-2 font-semibold text-[#26607a] transition-colors hover:bg-[#dcecf5]"
        >
          Twitter
        </a>
        <a
          href={shareLinks.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-full border border-[#c8b397] bg-[#e7f5ec] px-6 py-2 font-semibold text-[#2b6a49] transition-colors hover:bg-[#d9ecdf]"
        >
          WhatsApp
        </a>
        <a
          href={shareLinks.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-full border border-[#c8b397] bg-[#e8eef8] px-6 py-2 font-semibold text-[#264d7d] transition-colors hover:bg-[#dae4f3]"
        >
          LinkedIn
        </a>
      </div>
    </div>
  );
}
