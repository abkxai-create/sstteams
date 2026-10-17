/*
# Seed default workers and sites

1. Plain-English
Loads the starting dataset for ScaffoldAlloc: 27 scaffolding workers across
SST, Mountain Sky, Outsiders and Al Barsha Sub, plus 5 worksites
(Shanthi Foundation, HTS, EGE Interior, Cradle Work, Sajja Yard).
Only inserts rows that are missing, so re-running never duplicates.

2. Tables modified
- `workers`: insert seed rows if not present
- `sites`: insert seed rows if not present

3. Security
No policy changes.
*/

INSERT INTO workers (id, emp_code, name, designation, company, sheet_source, phone, status, sort_order)
SELECT v.id, v.emp_code, v.name, v.designation, v.company, v.sheet_source, v.phone, 'active', v.sort_order
FROM (VALUES
  ('w-yubaraj','SST-01','Yubaraj','Scaffolder Level 2','SST','Sheet 1: SST & M Sky',NULL,0),
  ('w-samim','SST-02','Samim','CISRS Scaffolder','SST','Sheet 1: SST & M Sky',NULL,1),
  ('w-mushtaq','MS-101','Mushtaq','Scaffolder Level 1','Mountain Sky','Sheet 1: SST & M Sky',NULL,2),
  ('w-ayoub','SST-03','Ayoub','Scaffolder Helper','SST','Sheet 1: SST & M Sky',NULL,3),
  ('w-tajammal','MS-102','Tajammal','Scaffolder Level 2','Mountain Sky','Sheet 1: SST & M Sky',NULL,4),
  ('w-godred','OUT-01','Godred','Scaffolding Helper','Outsiders','Sheet 2: Others & Outsiders',NULL,5),
  ('w-waseem','SST-04','Waseem','Scaffolder Level 2','SST','Sheet 1: SST & M Sky',NULL,6),
  ('w-shan','SST-05','Shan','Scaffolder Level 1','SST','Sheet 1: SST & M Sky',NULL,7),
  ('w-haleem','MS-103','Haleem','CISRS Scaffolder','Mountain Sky','Sheet 1: SST & M Sky',NULL,8),
  ('w-rajkumar','OUT-02','Rajkumar','Scaffolder Level 2','Outsiders','Sheet 2: Others & Outsiders',NULL,9),
  ('w-imran','SST-06','Imran','Scaffolding Helper','SST','Sheet 1: SST & M Sky',NULL,10),
  ('w-vinod','MS-104','Vinod','Scaffolder Level 1','Mountain Sky','Sheet 1: SST & M Sky',NULL,11),
  ('w-qurban','SST-07','Qurban','Scaffolder Level 2','SST','Sheet 1: SST & M Sky',NULL,12),
  ('w-nadeem','SST-08','Nadeem','Heavy Driver / Trailer','SST','Sheet 1: SST & M Sky',NULL,13),
  ('w-jemberu','OUT-03','Jemberu','Scaffolder Level 1','Outsiders','Sheet 2: Others & Outsiders',NULL,14),
  ('w-tanveer','MS-105','Tanveer','Scaffolding Helper','Mountain Sky','Sheet 1: SST & M Sky',NULL,15),
  ('w-ashenafi','OUT-04','Ashenafi','Scaffolder Level 1','Outsiders','Sheet 2: Others & Outsiders',NULL,16),
  ('w-junaid','SST-09','Junaid','Scaffolding Helper','SST','Sheet 1: SST & M Sky',NULL,17),
  ('w-qadeer','SST-F1','Qadeer','Scaffold Foreman','SST','Sheet 1: SST & M Sky','+971 50 111 2233',18),
  ('w-zubair','MS-F2','Zubair','Scaffold Foreman','Mountain Sky','Sheet 1: SST & M Sky','+971 55 222 3344',19),
  ('w-naeem','SST-F3','Naeem','Scaffold Foreman','SST','Sheet 1: SST & M Sky','+971 52 333 4455',20),
  ('w-safdar','MS-F4','Safdar','Cradle Foreman','Mountain Sky','Sheet 1: SST & M Sky','+971 56 444 5566',21),
  ('w-tariq','SST-10','Tariq Mahmood','Safety Inspector','SST','Sheet 1: SST & M Sky',NULL,22),
  ('w-riaz','SST-11','Mohammed Riaz','CISRS Advanced Scaffolder','SST','Sheet 1: SST & M Sky',NULL,23),
  ('w-bilal','MS-106','Bilal Ahmed','Scaffolder Level 2','Mountain Sky','Sheet 1: SST & M Sky',NULL,24),
  ('w-dilawar','OUT-05','Dilawar Khan','Scaffolding Helper','Outsiders','Sheet 2: Others & Outsiders',NULL,25),
  ('w-habib','ABS-01','Habib Ur Rehman','Subcontract Lead','Al Barsha Sub','Sheet 2: Others & Outsiders',NULL,26),
  ('w-deepak','OUT-06','Deepak Thapa','Scaffolding Helper','Outsiders','Sheet 2: Others & Outsiders',NULL,27)
) AS v(id, emp_code, name, designation, company, sheet_source, phone, sort_order)
ON CONFLICT (id) DO NOTHING;

INSERT INTO sites (id, name, code, location, incharge_name, reporting_time, target_headcount, notes, sort_order)
SELECT v.id, v.name, v.code, v.location, v.incharge_name, v.reporting_time, v.target_headcount, v.notes, v.sort_order
FROM (VALUES
  ('site-shanthi','SHANTHI FOUNDATION','SF-01','Dubai, UAE','Qadeer','6:00AM',6,'Scaffolding erection & support',1),
  ('site-hts','HTS','HTS-02','Sharjah, UAE','Zubair','6:00AM',6,'Perimeter access scaffolding',2),
  ('site-ege','EGE INTERIOR','EGE-03','Downtown Dubai','Naeem','6:00AM',6,'Internal towers & ceiling staging',3),
  ('site-cradle','CRADLE WORK','CW-04','Business Bay, Dubai','Safdar','6:00AM',4,'Suspended cradle rigging and inspection',4),
  ('site-sajja','SAJJA YARD & MAINTENANCE','SY-05','Sajja Industrial Area, Sharjah','Noor Mohammad','6:30AM',5,'Material dispatch, tube bundling and coupler repair',5)
) AS v(id, name, code, location, incharge_name, reporting_time, target_headcount, notes, sort_order)
ON CONFLICT (id) DO NOTHING;