import { query } from './db'

// Rank order: availability (most) → interest alignment → location proximity → reputation (tie-breaker)
// Hard filter: must be barter-compatible (they offer what I want AND they want what I offer)
export async function rankMatches({ userId, myCity }) {
  // availability proxy: recent message/trade activity count; location match: same city; reputation: avgstars + log(ratingcount)
  const sql = `
with me as (
  select u.user_id, lower(coalesce(u.location,'')) loc
  from users_tbl u where u.user_id = $1
),
my_wants as (
  select distinct genSkills_id from userInterests_tbl where user_id = $1
),
my_offers as (
  select distinct s.genSkills_id
  from userSkills_tbl us
  join specSkills_tbl s using (specSkills_id)
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
    select 1 from userSkills_tbl us
    join specSkills_tbl s using (specSkills_id)
    join my_wants mw on mw.genSkills_id = s.genSkills_id
    where us.user_id = c.user_id
  )
  and exists (
    select 1 from userInterests_tbl ui
    join my_offers mo on mo.genSkills_id = ui.genSkills_id
    where ui.user_id = c.user_id
  )
),
features as (
  select c.user_id,
    (select count(distinct s.specSkills_id)
       from userSkills_tbl us
       join specSkills_tbl s using (specSkills_id)
       join my_wants mw on mw.genSkills_id = s.genSkills_id
       where us.user_id = c.user_id) as overlap_specskills,
    (select count(distinct mo.genSkills_id)
       from my_offers mo
       join userInterests_tbl ui on ui.genSkills_id = mo.genSkills_id
       where ui.user_id = c.user_id) as reciprocal_overlap,
    (select count(*) from messages_tbl m
       where (m.sender_id = c.user_id or m.receiver_id = c.user_id)
         and now() - coalesce(m.timestamp_sent, now()) <= interval '14 days') as availability_score,
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
    least(3, f.availability_score) as availability,
    f.overlap_specskills as align1,
    f.reciprocal_overlap as align2,
    case when split_part(f.location, ',', 1) = split_part($2, ',', 1) then 1 else 0 end as locmatch,
    (f.avgstars + least(1.5, ln(1 + f.ratingcount))) as reputation,
    (
      5.0*least(3, f.availability_score) +
      3.0*f.overlap_specskills +
      2.0*f.reciprocal_overlap +
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

  const { rows } = await query(sql, [userId, myCity || ''])
  return rows
}