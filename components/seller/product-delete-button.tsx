"use client";

import { deleteSellerProduct } from "@/app/(seller)/seller/actions";

export default function ProductDeleteButton({ productId }: { productId: string }) {
  return <form action={deleteSellerProduct} onSubmit={(event) => {
    if (!window.confirm("Delete this product and its photos? This cannot be undone.")) event.preventDefault();
  }}>
    <input type="hidden" name="product_id" value={productId}/>
    <button className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Delete</button>
  </form>;
}
