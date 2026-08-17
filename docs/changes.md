## export feature

- daily records should be exported to csv and sheet

- export option date a to date be

- export all date record

- admin can able to download multiple clg data at once

- export option should have send to email

## email integration

- when a instructor is evaluated/anlyzed a email should be sent to admin and instructor about that day result
- when admin create a boa → admin also create boa password → boa should also able to change password → to change password → otp varification via email/phone

## authentication & authorization

- two role : admin ( super control ) + boa
- admin create boa (at time of creation, make sure all data that belongs to a boa is fulfilled)
- if boa is assigned a clg and instructor , then he can make attendence , see details of instructors , admin will have read/write permission

## features

- if boa give same instructor image mulitple times → warning about previous submission , if yes → save latest analysis in db , → in daily record table show only latest data
- in remarks(daily records) , it would be better to give a kind of a tag like good/excellent/best which will reflect a instructor's average performance
- boa take picture → task goes to background , a pending status to daily record table → instrcutor table data injection will happen, attendance table data injection, evaluatio table pending → evaluation complete , background task finishes , database transaction happen → status done → evaluation report saved in db.
-

## new additions

- logo should be changed
- export feature should have features like : send to mail, export to csv and sheets
- when boa is added , to connect boa easily → connect boa to clg name (in database boa connected to clg via clg id)
- boa management in admin dashboard, show college name instead of college id
- if boa boa_1 is assigned to abc college, then boa_1 can able to take attendance of all instructors of abc college
- in daily records table, show current date data, if no data then show no data.
- in boa show contact details also
- boa dashboard in admin portal should look like employee id, boa name, college name, contact info

## auth ideas

- suppose admin create a boa_1 → admin assigned boa_1 to college clg_1
- admin also created some instructor ins_1, ins_2, ins_3 , → assigned ins_1, ins_2, ins_3 to colg_1
- boa_1 will take pictures of ins_1, ins_2, ins_3 and will upload to attendance → boa_1 can see ins_1, ins_2, ins_3 details.
- if admin assign boa_1 to clg_1, then boa_1 can see all instructors belongs to clg_1.
- apply authentication system like this.
-
-

## new changes

- move logout button from top above to bottom of sidebar
- if boa submitted an image and status is pending, then all previous data in daily record currently disappears and wait until evaluation report complete. when evaluation completes then only show all data under daily record . this is flaw
-
