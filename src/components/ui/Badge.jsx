// Small status label. tone: neutral | ok | warn | info | danger
export default function Badge({ tone = 'neutral', children }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
