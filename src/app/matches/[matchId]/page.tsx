export default async function MatchPage(props: any) {
  const id = props.params?.matchId;
  return (
    <div style={{ padding: 40 }}>
      <h1>Матч {id}</h1>
    </div>
  );
}
