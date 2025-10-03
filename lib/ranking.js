import { query } from "./db.js"

// Returns ALL ranked matches (barter-compatible hard filter)
export async function rankMatches({ userId, myCity = "" }) {
  const sql = `
with me as (
  select lower(coalesce(u.location,'')) as loc
  from users_tbl u where u.user_id = $1
),
my_wants as (
  select distinct genskills_id from userinterests_tbl where user_id = $1
),
my_offers as (
  select distinct s.genskills_id
  from userskills_tbl us
  join specskills_tbl s using (specskills_id)
  where us.user_id = $1
),
candidates as (
  select u.user_id, (coalesce(u.first_name,'')||' '||coalesce(u.last_name,'')) as name,
         lower(coalesce(u.location,'')) as location,
         coalesce(u.avgstars,0) avgstars, coalesce(u.ratingcount,0) ratingcount,
         coalesce(u.is_verified,false) verified
  from users_tbl u
  where u.user_id <> $1 and coalesce(u.is_active,true) = true
),
compatible as (
  select c.user_id
  from candidates c
  where exists (
    select 1 from userskills_tbl us
    join specskills_tbl s using (specskills_id)
    join my_wants mw on mw.genskills_id = s.genskills_id
    where us.user_id = c.user_id
  )
  and exists (
    select 1 from userinterests_tbl ui
    join my_offers mo on mo.genskills_id = ui.genskills_id
    where ui.user_id = c.user_id
  )
),
features as (
  select c.user_id,
    (select count(distinct s.specskills_id)
       from userskills_tbl us
       join specskills_tbl s using (specskills_id)
       join my_wants mw on mw.genskills_id = s.genskills_id
       where us.user_id = c.user_id) as align1,
    (select count(distinct mo.genskills_id)
       from my_offers mo
       join userinterests_tbl ui on ui.genskills_id = mo.genskills_id
       where ui.user_id = c.user_id) as align2,
    (select count(*)
       from tradereq_tbl tr
       where (tr.requester_id = c.user_id or tr.responder_id = c.user_id)
         and (tr.reqdeadline >= current_date or tr.created_at >= now() - interval '14 days')
    ) as availability,
    c.location, c.name, c.avgstars, c.ratingcount, c.verified
  from candidates c
  join compatible x on x.user_id = c.user_id
),
scored as (
  select
    f.user_id,
    f.name,
    f.location,
    f.verified,
    least(3, f.availability) as availability,
    f.align1,
    f.align2,
    case when split_part(f.location, ',', 1) = split_part($2, ',', 1) then 1 else 0 end as locmatch,
    (f.avgstars + least(1.5, ln(1 + f.ratingcount))) as reputation,
    (
      5.0*least(3, f.availability) +
      3.0*f.align1 +
      2.0*f.align2 +
      1.5*(case when split_part(f.location, ',', 1) = split_part($2, ',', 1) then 1 else 0 end) +
      1.0*(f.avgstars + least(1.5, ln(1 + f.ratingcount))) +
      case when f.verified then 0.5 else 0 end
    ) as total
  from features f
)
select user_id as userId, name, location, verified,
       availability, align1, align2, locmatch, reputation,
       round(total::numeric, 3) as totalScore
from scored
order by total desc, reputation desc, userId asc;`
  const { rows } = await query(sql, [userId, myCity])
  return rows
}