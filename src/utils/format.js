export function formatDate(ts) {
  if (!ts || typeof ts.toDate !== "function") return "—";
  return ts.toDate().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function byNewest(a, b) {
  return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
}
