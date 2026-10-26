# FAKE DATA — TEST T1 — not real

Test T1 (REQ-20261019-SLM-004) for the evening check-in's alternative path. Salem passed on a fake answer and I recorded it here only. No real record was opened for writing.

Fake answer: «صرفت 12.50 غدا، و3 قهوة. الصلوات 4 بوقتها وواحدة متأخرة. نمت 11:15. الفيب التزمت. سكر الشاي التزمت. الموية 2 لتر. ما تمرنت.»

## LEDGER (rows that would be appended to STATE\LEDGER.csv)

```csv
event_id,occurred_at,type,amount,currency,wallet,cash_delta,receivable_delta,source,notes
FAKE-20990101-01,2099-01-01,expense,12.50,RM,يومية,-12.50,0.00,"FAKE — test T1 via Salem","غدا [FAKE]"
FAKE-20990101-02,2099-01-01,expense,3.00,RM,يومية,-3.00,0.00,"FAKE — test T1 via Salem","قهوة [FAKE]"
```

## logs (rows that would be appended to STATE\logs\*.csv)

prayers.csv (he didn't say which prayer was late, so the per-prayer columns stay empty)
```csv
date,fajr,dhuhr,asr,maghrib,isha,on_time_count,late_count,missed_count,notes
2099-01-01,,,,,,4,1,0,"FAKE — test T1; which prayer was late is unknown"
```

sleep.csv
```csv
date,bed_time,wake_time,sleep_hours,on_target_1030,notes
2099-01-01,11:15 PM,,,no,"FAKE — test T1; wake time unknown"
```

vape.csv
```csv
date,plan_day,allowed_cut_min,kept_limit,notes
2099-01-01,,,yes,"FAKE — test T1; plan day not calculated for a fake date"
```

tea.csv
```csv
date,plan_sugar_g,actual_sugar_g,tea_g,thermos_finished,notes
2099-01-01,,,,,"FAKE — test T1; kept the allowance: yes; grams not calculated for a fake date"
```

water.csv
```csv
date,water_l,target_l,notes
2099-01-01,2,3,"FAKE — test T1"
```

workouts.csv
```csv
date,planned,done,type,duration_min,laps_365m,swim_min,notes
2099-01-01,,no,,,,,"FAKE — test T1; planned session not calculated for a fake date"
```

food.csv (unanswered, so this row is not written)
```csv
date,meal,time,item,source,kcal_est,protein_g_est,notes
```

daily_summary.csv
```csv
date,prayers_on_time,bed_time,vape_kept,sugar_g,water_l,kcal,trained,spent_rm,weight_kg
2099-01-01,4,11:15 PM,yes,,2,,no,15.50,
```
## T2 FAKE

FAKE DATA — TEST T2 — not real. This came in the [EVENING-ANSWER] format Salem forwarded. No real record was opened for writing.

Fake answer: «صرفت 8 فطور و20 بنزين. الصلوات كلها بوقتها. نمت 10:40. الفيب ما التزمت. الشاي التزمت. موية 3 لتر.»

LEDGER.csv
```csv
event_id,occurred_at,type,amount,currency,wallet,cash_delta,receivable_delta,source,notes
FAKE-20990102-01,2099-01-02,expense,8.00,RM,يومية,-8.00,0.00,"FAKE — test T2 via Salem [EVENING-ANSWER]","فطور [FAKE]"
FAKE-20990102-02,2099-01-02,expense,20.00,RM,يومية,-20.00,0.00,"FAKE — test T2 via Salem [EVENING-ANSWER]","بنزين [FAKE]"
```

prayers.csv
```csv
date,fajr,dhuhr,asr,maghrib,isha,on_time_count,late_count,missed_count,notes
2099-01-02,on_time,on_time,on_time,on_time,on_time,5,0,0,"FAKE — test T2"
```

sleep.csv
```csv
date,bed_time,wake_time,sleep_hours,on_target_1030,notes
2099-01-02,10:40 PM,,,no,"FAKE — test T2; wake time unknown"
```

vape.csv
```csv
date,plan_day,allowed_cut_min,kept_limit,notes
2099-01-02,,,no,"FAKE — test T2; plan day not calculated for a fake date"
```

tea.csv
```csv
date,plan_sugar_g,actual_sugar_g,tea_g,thermos_finished,notes
2099-01-02,,,,,"FAKE — test T2; kept the allowance: yes; grams not calculated for a fake date"
```

water.csv
```csv
date,water_l,target_l,notes
2099-01-02,3,3,"FAKE — test T2"
```

daily_summary.csv
```csv
date,prayers_on_time,bed_time,vape_kept,sugar_g,water_l,kcal,trained,spent_rm,weight_kg
2099-01-02,5,10:40 PM,no,,3,,,28.00,
```

Not written because he didn't answer: workouts.csv (training) and food.csv (food/kcal), so both stay unknown, not "no" or zero. qada.xlsx: no count given, so nothing is written. OPEN_LOOPS.md: nothing is added, because no item is unresolved from this answer (the missing training and food answers are just unknown).

CURRENT.md, how it would change in a real run (real file not opened; X = today's real balance before the change):
- If today's 2099-01-02 RM 16 transfer isn't recorded yet: شهري −16 and يومية +16, applied once only.
- Spending: يومية −28.00 (8 + 20). Net for يومية: X + 16 − 28 = X − 12.00 [calculated]. If it goes below zero it stays negative and isn't covered from another box. خزينة: unchanged.