export default function AboutPage() {
  return (
    <main className="max-w-[680px] mx-auto px-6 pt-12 pb-20">
      <div className="text-[11px] font-extrabold tracking-[0.16em] text-accent mb-2">ABOUT</div>
      <h1 className="text-[36px] font-extrabold m-0 mb-4 tracking-[-0.02em]">Fight Oracle</h1>
      <p className="text-ink-dim text-[15px] leading-[1.7] mb-4">
        Fight Oracle uses a Random Forest model trained on over 5,000 historical UFC bouts to predict fight outcomes.
        It analyses 17 statistical features — striking output, grappling, win streaks, physical attributes, and more —
        to calculate win probability for any two fighters in the dataset.
      </p>
      <p className="text-ink-dim text-[15px] leading-[1.7]">
        This is a data science project. Predictions are based on historical patterns and are for entertainment purposes only.
        Not betting advice.
      </p>
    </main>
  )
}
