import { redirect } from "next/navigation";

interface Props {
  params: { id: string }
}

export default function RoomResultsRedirect({ params }: Props) {
  redirect(`/games/${params.id}/results`);
  return null;
} 