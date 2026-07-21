export default function Loader({ full }) {
  return (
    <div className={full ? "loader-wrap loader-full" : "loader-wrap"}>
      <span className="spinner" />
    </div>
  );
}
