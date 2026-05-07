interface Props {
  enabled: boolean
  loading: boolean
  onClick: () => void
}

export default function PredictButton({ enabled, loading, onClick }: Props) {
  const active = enabled && !loading
  return (
    <button
      onClick={onClick}
      disabled={!active}
      className={`w-full py-4 px-6 border-0 rounded-[10px] text-base font-bold tracking-[-0.01em] text-white flex items-center justify-center gap-2.5 transition-colors duration-150 ${
        active
          ? 'bg-accent hover:bg-[#c5002f] cursor-pointer'
          : 'bg-line-strong cursor-not-allowed'
      }`}
    >
      {loading && (
        <div className="w-[18px] h-[18px] border-2 border-white/40 border-t-white rounded-full animate-spin" />
      )}
      {loading ? 'Predicting…' : 'Predict Winner →'}
    </button>
  )
}
