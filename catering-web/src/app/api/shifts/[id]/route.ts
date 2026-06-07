import type { NextRequest } from "next/server";
import { getUserFromBearer } from "@/lib/api-auth";
import { getShiftDetail } from "@/services/shifts";
import { apiJson, apiError, apiOptions } from "@/lib/api";

export function OPTIONS() {
  return apiOptions();
}

// GET /api/shifts/[id] -> full shift details (Bearer auth, members only)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromBearer(req);
  if (!user) return apiError("Unauthorized.", 401);

  const { id } = await params;
  const shiftId = Number(id);
  if (!Number.isInteger(shiftId)) return apiError("Invalid shift id.", 400);

  const shift = await getShiftDetail(shiftId, user.id);
  if (!shift) return apiError("Shift not found.", 404);
  if (!shift.isMember) {
    return apiError("You are not a member of this group.", 403);
  }

  return apiJson({
    id: shift.id,
    title: shift.title,
    date: shift.date,
    startTime: shift.startTime,
    endTime: shift.endTime,
    location: shift.location,
    groupId: shift.groupId,
    groupTitle: shift.groupTitle,
    capacity: shift.capacity,
    staffCount: shift.staffCount,
    commentCount: shift.commentCount,
    state: shift.state,
    isJoined: shift.currentUserExtraSlots !== null,
    extraSlots: shift.currentUserExtraSlots,
    isManager: shift.currentUserIsManager,
    staff: shift.staff,
    comments: shift.comments,
  });
}
