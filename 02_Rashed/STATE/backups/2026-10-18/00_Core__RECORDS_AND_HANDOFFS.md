# عقود السجلات والتسليم
## سجل معلومة
fact_id | value | unit | status | source | observed_at | recorded_at | owner | next_verify
unknown ليست صفرًا. planned ليست executed. رقم منقول ليس قياسًا جديدًا.
## مهمة
id | title | owner | status(open/blocked/done/cancelled) | due_at | source | next_action | done_evidence
لا حالة done بلا دليل. لكل مهمة مالك واحد.
## قرار
id | date | topic | chosen | reason | alternatives | approved_by | source | review_at | supersedes
التوصية provisional، واعتماد المستخدم approved، ووجود موافقة لا يثبت التنفيذ.
## حدث
event_id | occurred_at | source_message_id | type | payload | applied_at
تحقق من معرف الرسالة/المعاملة قبل التسجيل؛ عند عدم وجود معرف استخدم التاريخ والمبلغ والوصف كمرشح تطابق واسأل فقط عند التباس مؤثر. لا تمنع مصروفين متساويين صحيحين.
## تسليم
المرسل ينشئ ملفًا في OUTBOX الخاص به:
id / from / to / topic / source / confidence / requested_action / due_at / minimum_payload / status(prepared, delivered, acknowledged, applied) / result_reference.
لا يعده delivered لمجرد حفظه محليًا. التسليم الفعلي يحتاج موصل رسائل مثبتًا وتفويضًا، أو نقل محمد يدويًا.
المستلم يكتب إقراره في OUTBOX الخاص به أو سجل ACKS الخاص به، ولا يعدل ملف المرسل. يزيل التكرار بمعرف handoff_id، ولا يطبق نفس العملية مرتين.
## تقويم
event_id | owner | start_at | end_at | timezone | recurrence | exceptions | status(tentative/confirmed/cancelled) | source | external_id
راشد وحده يكتب التقويم المشترك في 02_Rashed/STATE/CALENDAR.md. سالي يملك الموعد الأكاديمي في سجله؛ التقويم نسخة عرض منه مع source_id. المقترح لا يصير حجزًا مؤكدًا. تعارض الوقت: نهاية A أكبر من بداية B وبداية A أصغر من نهاية B، مع وقت انتقال واقعي.
## المال
كل المبالغ بعملة واضحة ودقتين عشريتين. نوع الحركة expense/income/transfer/receivable_created/receivable_settled/correction.
لا تقيد سداد الذمة دخلاً جديدًا ولا مصروفًا سالبًا. لا تخلط RM وSAR دون سعر مؤرخ.
