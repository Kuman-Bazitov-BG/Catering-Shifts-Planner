CREATE INDEX "group_invites_group_id_idx" ON "group_invites" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "group_members_user_id_idx" ON "group_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "shift_comments_shift_id_idx" ON "shift_comments" USING btree ("shift_id","created_at");--> statement-breakpoint
CREATE INDEX "shift_joins_shift_id_idx" ON "shift_joins" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "shift_joins_user_id_idx" ON "shift_joins" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "shifts_group_id_date_idx" ON "shifts" USING btree ("group_id","date","start_time");--> statement-breakpoint
CREATE INDEX "shifts_date_idx" ON "shifts" USING btree ("date");