/* ============================================
   Seed Exercise Library API Route
   POST /api/seed-exercises
   Inserts the full exercise library for a user.
   Called once during onboarding or first programme generation.
   ============================================ */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// All 55+ bodyweight exercises from the seed data document
const EXERCISES = [
  {"name":"Standard Push-Up","description":"Classic push-up from hands and toes. Lower chest to the ground and press back up.","form_cue":"Keep your core tight and body in a straight line. Do not let hips sag or pike up.","muscles":["chest","triceps","shoulders","core"],"difficulty":2,"category":"strength","min_rank":1},
  {"name":"Wide Push-Up","description":"Push-up with hands placed wider than shoulder width to emphasise the chest.","form_cue":"Hands 1.5x shoulder width apart. Keep elbows at 45 degrees, not flared out to 90.","muscles":["chest","shoulders"],"difficulty":2,"category":"strength","min_rank":1},
  {"name":"Diamond Push-Up","description":"Push-up with hands together forming a diamond shape under the chest. Heavy tricep focus.","form_cue":"Touch thumbs and index fingers together. Keep elbows close to your body.","muscles":["triceps","chest","shoulders"],"difficulty":3,"category":"strength","min_rank":3},
  {"name":"Decline Push-Up","description":"Push-up with feet elevated on a step, bench, or garden wall. Increases upper chest and shoulder load.","form_cue":"The higher your feet, the harder it gets. Keep core braced throughout.","muscles":["chest","shoulders","triceps"],"difficulty":3,"category":"strength","min_rank":4},
  {"name":"Pike Push-Up","description":"Push-up from a pike position (hips high, body in an inverted V). Targets shoulders like an overhead press.","form_cue":"Walk feet in towards hands to raise hips. Lower the top of your head towards the floor.","muscles":["shoulders","triceps"],"difficulty":3,"category":"strength","min_rank":4},
  {"name":"Archer Push-Up","description":"Wide push-up where you shift weight to one arm at a time. Progression towards one-arm push-up.","form_cue":"As you lower, shift towards one hand. The other arm stays extended for support.","muscles":["chest","triceps","shoulders"],"difficulty":4,"category":"strength","min_rank":6},
  {"name":"Explosive Push-Up","description":"Push-up where you push hard enough for hands to leave the ground. Builds power.","form_cue":"Drive up explosively. Land softly with a slight bend in elbows.","muscles":["chest","triceps","shoulders"],"difficulty":4,"category":"strength","min_rank":7},
  {"name":"One-Arm Push-Up","description":"Full push-up on a single arm. Elite-level bodyweight exercise.","form_cue":"Widen your feet for balance. Keep hips as square as possible. Control the descent.","muscles":["chest","triceps","shoulders","core"],"difficulty":5,"category":"strength","min_rank":9},
  {"name":"Bodyweight Squat","description":"Standard squat with no weight. Fundamental lower body exercise.","form_cue":"Feet shoulder width apart. Push hips back and down. Keep chest up and knees tracking over toes.","muscles":["quads","glutes","hamstrings"],"difficulty":1,"category":"strength","min_rank":1},
  {"name":"Jump Squat","description":"Squat with an explosive jump at the top. Builds power and cardio.","form_cue":"Squat deep then explode upward. Land softly on the balls of your feet.","muscles":["quads","glutes","calves"],"difficulty":3,"category":"strength","min_rank":3},
  {"name":"Sumo Squat","description":"Wide stance squat with toes pointed outward. Emphasises inner thighs and glutes.","form_cue":"Feet wider than shoulders, toes at 45 degrees. Keep torso upright as you lower.","muscles":["quads","glutes","adductors"],"difficulty":2,"category":"strength","min_rank":1},
  {"name":"Pistol Squat (Assisted)","description":"Single leg squat using a wall, doorframe, or post for balance support.","form_cue":"Hold onto something for balance. Extend one leg forward and lower slowly on the other.","muscles":["quads","glutes","core"],"difficulty":4,"category":"strength","min_rank":5},
  {"name":"Wall Sit","description":"Static hold with back against a wall, thighs parallel to the ground.","form_cue":"Slide your back down the wall until knees are at 90 degrees. Hold that position. Do not rest hands on thighs.","muscles":["quads","glutes"],"difficulty":2,"category":"strength","min_rank":1},
  {"name":"Forward Lunge","description":"Step forward and lower until both knees are at 90 degrees. Alternate legs.","form_cue":"Take a big step forward. Lower back knee towards the ground. Front knee stays behind toes.","muscles":["quads","glutes","hamstrings"],"difficulty":2,"category":"strength","min_rank":1},
  {"name":"Reverse Lunge","description":"Step backward into a lunge. Easier on the knees than forward lunges.","form_cue":"Step back and lower. Keep your front shin vertical. Drive back up through your front heel.","muscles":["quads","glutes","hamstrings"],"difficulty":2,"category":"strength","min_rank":1},
  {"name":"Walking Lunge","description":"Continuous lunges moving forward. Covers distance while working legs.","form_cue":"Take controlled steps. Do not rush. Keep torso upright throughout.","muscles":["quads","glutes","hamstrings"],"difficulty":2,"category":"strength","min_rank":2},
  {"name":"Jump Lunge","description":"Lunge with an explosive jump to switch legs mid-air.","form_cue":"Explode upward from the lunge, switch legs in the air, land softly.","muscles":["quads","glutes","calves"],"difficulty":4,"category":"strength","min_rank":5},
  {"name":"Lateral Lunge","description":"Step out to the side and lower into a side lunge. Targets inner thighs.","form_cue":"Step wide to one side, push hips back, keep the other leg straight.","muscles":["quads","glutes","adductors"],"difficulty":2,"category":"strength","min_rank":2},
  {"name":"Plank","description":"Hold a straight body position on forearms and toes. Core endurance staple.","form_cue":"Forearms flat, elbows under shoulders. Squeeze glutes, brace core. Body in a straight line.","muscles":["core","shoulders"],"difficulty":2,"category":"core","min_rank":1},
  {"name":"Side Plank","description":"Plank on one forearm, body sideways. Targets obliques.","form_cue":"Stack feet or stagger them. Lift hips so body forms a straight line. Do not let hips drop.","muscles":["obliques","core","shoulders"],"difficulty":2,"category":"core","min_rank":1},
  {"name":"Plank Shoulder Taps","description":"High plank position, alternately tap each shoulder with the opposite hand.","form_cue":"Keep hips as still as possible. Resist the urge to rotate. Slow and controlled.","muscles":["core","shoulders"],"difficulty":3,"category":"core","min_rank":2},
  {"name":"Up-Down Plank","description":"Alternate between forearm plank and high plank by pressing up one arm at a time.","form_cue":"Move with control. Alternate which arm leads each rep. Minimise hip rocking.","muscles":["core","shoulders","triceps"],"difficulty":3,"category":"core","min_rank":3},
  {"name":"Bicycle Crunch","description":"Lying crunch with rotation, bringing opposite elbow to knee alternately.","form_cue":"Hands behind head but do not pull on neck. Fully extend the straight leg. Controlled tempo.","muscles":["core","obliques"],"difficulty":2,"category":"core","min_rank":1},
  {"name":"Leg Raises","description":"Lying flat, raise straight legs to vertical then lower slowly.","form_cue":"Press lower back into the floor. Lower legs slowly. Stop before back arches off the floor.","muscles":["core","hip flexors"],"difficulty":3,"category":"core","min_rank":2},
  {"name":"Flutter Kicks","description":"Lying on back, alternating small fast kicks with straight legs raised off the ground.","form_cue":"Keep lower back pressed into floor. Legs stay straight. Small controlled kicks.","muscles":["core","hip flexors"],"difficulty":2,"category":"core","min_rank":1},
  {"name":"V-Up","description":"Simultaneously raise legs and torso to form a V shape, touching toes at the top.","form_cue":"Keep legs and arms straight. Meet at the top. Lower with control.","muscles":["core"],"difficulty":3,"category":"core","min_rank":4},
  {"name":"Dead Bug","description":"Lying on back, extend opposite arm and leg while keeping core braced.","form_cue":"Press lower back into floor throughout. Move slowly. Breathe out as you extend.","muscles":["core"],"difficulty":1,"category":"core","min_rank":1},
  {"name":"Mountain Climber","description":"High plank position, alternately driving knees to chest at speed.","form_cue":"Keep hips level, do not pike up. Drive knees forward with control.","muscles":["core","hip flexors","shoulders"],"difficulty":2,"category":"cardio","min_rank":1},
  {"name":"Burpee","description":"Squat down, jump feet back to plank, do a push-up, jump feet forward, explode up.","form_cue":"Full push-up at the bottom. Full jump at the top. Move with purpose.","muscles":["full body"],"difficulty":3,"category":"cardio","min_rank":2},
  {"name":"Burpee (No Push-Up)","description":"Simplified burpee without the push-up. Squat, jump back, jump forward, stand.","form_cue":"Maintain a fast pace. Land softly on each jump.","muscles":["full body"],"difficulty":2,"category":"cardio","min_rank":1},
  {"name":"Bear Crawl","description":"Crawl forward on hands and feet with knees hovering just off the ground.","form_cue":"Knees stay 1 inch off the ground. Opposite hand and foot move together. Stay low.","muscles":["core","shoulders","quads"],"difficulty":3,"category":"cardio","min_rank":3},
  {"name":"High Knees","description":"Running in place, driving knees up to waist height alternately at speed.","form_cue":"Pump arms. Drive knees high. Stay on balls of feet.","muscles":["core","hip flexors","calves"],"difficulty":2,"category":"cardio","min_rank":1},
  {"name":"Star Jump","description":"Explosive jump from a squat, spreading arms and legs wide in the air.","form_cue":"Squat low, then explode up reaching arms and legs out. Land softly back into squat.","muscles":["quads","glutes","calves","shoulders"],"difficulty":2,"category":"cardio","min_rank":1},
  {"name":"Tuck Jump","description":"Explosive jump bringing knees to chest at the peak.","form_cue":"Drive knees up, do not lean forward to meet them. Land softly with bent knees.","muscles":["quads","glutes","core","calves"],"difficulty":3,"category":"cardio","min_rank":4},
  {"name":"Shadow Boxing","description":"Boxing combinations thrown at the air. Jab, cross, hook, uppercut. Great cardio.","form_cue":"Stay light on your feet. Rotate your hips with each punch. Keep hands up between combos.","muscles":["shoulders","core","arms"],"difficulty":2,"category":"cardio","min_rank":1},
  {"name":"Glute Bridge","description":"Lying on back with knees bent, drive hips upward squeezing glutes at the top.","form_cue":"Feet flat on the floor, hip width apart. Drive through heels. Squeeze glutes hard at the top.","muscles":["glutes","hamstrings"],"difficulty":1,"category":"strength","min_rank":1},
  {"name":"Single Leg Glute Bridge","description":"Glute bridge performed on one leg. Doubles the load per side.","form_cue":"Extend one leg straight. Drive hips up using the planted leg only. Keep hips level.","muscles":["glutes","hamstrings","core"],"difficulty":3,"category":"strength","min_rank":3},
  {"name":"Calf Raise","description":"Stand on the edge of a step and raise up onto toes, then lower below step level.","form_cue":"Slow and controlled. Full range of motion. Pause at the top.","muscles":["calves"],"difficulty":1,"category":"strength","min_rank":1},
  {"name":"Step-Up","description":"Step up onto a garden bench, wall, or sturdy step. Alternate legs.","form_cue":"Drive through the heel of the stepping foot. Do not push off the back foot.","muscles":["quads","glutes"],"difficulty":2,"category":"strength","min_rank":1},
  {"name":"Tricep Dip (Bench)","description":"Dip using a garden bench, step, or sturdy chair behind you.","form_cue":"Hands on edge of bench, fingers forward. Lower until elbows hit 90 degrees. Press back up.","muscles":["triceps","shoulders","chest"],"difficulty":2,"category":"strength","min_rank":1},
  {"name":"Superman","description":"Lying face down, simultaneously lift arms and legs off the ground and hold.","form_cue":"Squeeze glutes and upper back to lift. Hold for 2-3 seconds. Lower with control.","muscles":["lower back","glutes"],"difficulty":1,"category":"strength","min_rank":1},
  {"name":"Reverse Snow Angel","description":"Lying face down, arms out to sides, sweep arms from hips to overhead while keeping them off the ground.","form_cue":"Keep arms straight and off the floor throughout. Squeeze shoulder blades together.","muscles":["upper back","shoulders","lower back"],"difficulty":2,"category":"strength","min_rank":2},
  {"name":"Prone Y-Raise","description":"Lying face down, raise arms overhead in a Y shape, squeezing upper back.","form_cue":"Thumbs pointing up. Lift arms using upper back muscles, not momentum.","muscles":["upper back","shoulders"],"difficulty":2,"category":"strength","min_rank":2},
  {"name":"Inchworm","description":"Standing, walk hands out to plank, then walk feet to hands. Repeat moving forward.","form_cue":"Keep legs as straight as possible. Walk hands out to a full plank before walking feet in.","muscles":["core","shoulders","hamstrings"],"difficulty":2,"category":"strength","min_rank":2},
  {"name":"Sprawl","description":"Like a burpee but without the jump. Drop to plank then immediately stand back up.","form_cue":"Fast transitions. Drop and get back up with urgency. Hips hit the ground briefly.","muscles":["full body"],"difficulty":3,"category":"cardio","min_rank":3},
  {"name":"Skater Jump","description":"Lateral jump from one foot to the other, like a speed skater.","form_cue":"Jump sideways, landing on one foot. Swing arms for momentum. Stay low.","muscles":["quads","glutes","calves"],"difficulty":2,"category":"cardio","min_rank":2},
  {"name":"Sprint (Garden)","description":"Short all-out sprints in the garden. Mark out 10-20 metres and go flat out.","form_cue":"Drive arms hard. High knees. Stay on balls of feet. Walk back to start as rest.","muscles":["quads","hamstrings","calves","glutes"],"difficulty":3,"category":"cardio","min_rank":2},
  {"name":"Child's Pose","description":"Kneeling stretch with arms extended forward, forehead on the ground. Rest and recovery.","form_cue":"Knees wide, big toes touching. Reach arms forward and relax into the stretch.","muscles":["lower back","shoulders","hips"],"difficulty":1,"category":"recovery","min_rank":1},
  {"name":"Downward Dog","description":"Inverted V position on hands and feet. Stretches hamstrings, calves, shoulders.","form_cue":"Press heels towards the floor. Push hips up and back. Arms straight, head between arms.","muscles":["hamstrings","calves","shoulders"],"difficulty":1,"category":"recovery","min_rank":1},
  {"name":"Cat-Cow Stretch","description":"On all fours, alternate between arching and rounding the spine.","form_cue":"Inhale as you arch (cow), exhale as you round (cat). Move slowly.","muscles":["spine","core"],"difficulty":1,"category":"recovery","min_rank":1},
  {"name":"Hip Flexor Stretch","description":"Kneeling lunge stretch targeting the hip flexors of the rear leg.","form_cue":"Back knee on the ground, front foot flat. Push hips forward gently. Keep torso upright.","muscles":["hip flexors","quads"],"difficulty":1,"category":"recovery","min_rank":1},
  {"name":"Standing Quad Stretch","description":"Standing on one leg, pull the other foot to your glute stretching the quad.","form_cue":"Keep knees together. Stand tall. Hold a wall for balance if needed.","muscles":["quads"],"difficulty":1,"category":"recovery","min_rank":1},
  {"name":"Hamstring Stretch","description":"Standing, place one heel on a low surface and lean forward to stretch the hamstring.","form_cue":"Keep the stretched leg straight. Hinge at the hips, do not round the back.","muscles":["hamstrings"],"difficulty":1,"category":"recovery","min_rank":1},

  // ─── PULL / BACK (no bar needed) ────────────────────────────
  {"name":"Inverted Row (Table)","description":"Lying under a sturdy table, grip the edge and pull your chest up to it. The bodyweight 'reverse push-up'.","form_cue":"Grip the table edge. Heels on the floor, body straight. Pull chest to the table.","muscles":["back","biceps","shoulders"],"difficulty":2,"category":"strength","min_rank":1},
  {"name":"Doorway Row","description":"Loop a towel around a sturdy door handle, lean back holding both ends, then row yourself upright.","form_cue":"Feet either side of the door. Lean back with straight arms. Pull your chest to the door.","muscles":["back","biceps"],"difficulty":2,"category":"strength","min_rank":1},
  {"name":"Towel Pull-Apart","description":"Hold a towel taut at chest height and pull the ends apart, squeezing the shoulder blades together.","form_cue":"Arms straight. Pull the towel apart using your upper back, not your arms.","muscles":["upper back","shoulders"],"difficulty":1,"category":"strength","min_rank":1},
  {"name":"Scapular Push-Up","description":"High plank position with locked arms. Retract and protract the shoulder blades only. Teaches scapular control.","form_cue":"Arms stay straight. Pinch shoulder blades together, then push them apart.","muscles":["shoulders","upper back","core"],"difficulty":1,"category":"strength","min_rank":1},
  {"name":"Reverse Plank","description":"Seated with legs extended, hands behind you, drive your hips up to form a straight reverse plank.","form_cue":"Hands under shoulders, fingers forward. Squeeze glutes. Body in one line from head to heels.","muscles":["glutes","hamstrings","core","shoulders"],"difficulty":2,"category":"strength","min_rank":2},

  // ─── UNILATERAL LEGS ──────────────────────────────────────────
  {"name":"Bulgarian Split Squat","description":"Rear foot elevated on a bench, chair, or step. Lower into a deep split squat on the front leg.","form_cue":"Keep front knee over ankle. Lower back knee toward the floor. Drive through the front heel.","muscles":["quads","glutes","hamstrings"],"difficulty":3,"category":"strength","min_rank":2},
  {"name":"Cossack Squat","description":"Wide stance, lower toward one heel while the other leg extends straight with toes up. Alternate sides.","form_cue":"Sit toward one heel. Other leg stays straight with toes pointing up. Chest proud.","muscles":["quads","glutes","adductors","hamstrings"],"difficulty":3,"category":"strength","min_rank":3},
  {"name":"Curtsy Lunge","description":"Step one leg behind and across the other into a curtsy-like lunge. Hits the glute medius hard.","form_cue":"Step back and across at a 45 degree angle. Lower straight down. Front knee stays stable.","muscles":["glutes","quads","adductors"],"difficulty":2,"category":"strength","min_rank":1},
  {"name":"Single-Leg Romanian Deadlift","description":"Balance on one leg and hinge forward, reaching toward the floor as the other leg extends straight back.","form_cue":"Hinge at the hips, flat back. Extended leg forms a straight line with the torso.","muscles":["hamstrings","glutes","lower back"],"difficulty":3,"category":"strength","min_rank":3},
  {"name":"Single-Leg Calf Raise","description":"Stand on one leg at the edge of a step. Raise onto the toes, then lower the heel below the step.","form_cue":"Full range of motion. Slow and controlled. Pause at the top and bottom.","muscles":["calves"],"difficulty":2,"category":"strength","min_rank":2},

  // ─── ADVANCED CORE ────────────────────────────────────────────
  {"name":"Hollow Body Hold","description":"Lying face up, press lower back into the floor and lift shoulders and legs off the ground to form a banana shape.","form_cue":"Lower back glued to the floor. Arms and legs hover. Hold the shape, don't let the back arch.","muscles":["core"],"difficulty":3,"category":"core","min_rank":3},
  {"name":"Arch Hold","description":"Lying face down, arms overhead. Lift chest, arms, and legs to form a reverse banana shape.","form_cue":"Squeeze glutes hard. Lift chest, arms, and legs together. Hold the tension.","muscles":["lower back","glutes","upper back"],"difficulty":3,"category":"core","min_rank":3},
  {"name":"Russian Twist","description":"Seated with feet off the ground, twist your torso to tap the floor on each side alternately.","form_cue":"Lean back at 45 degrees. Keep chest up. Rotate from the torso, not the arms.","muscles":["obliques","core"],"difficulty":2,"category":"core","min_rank":1},
  {"name":"L-Sit Tuck Hold","description":"Seated on the floor, press up on your hands and tuck your knees toward your chest while lifting your body.","form_cue":"Press hands into the ground. Push shoulders down. Lift hips and tuck knees high.","muscles":["core","triceps","shoulders"],"difficulty":4,"category":"core","min_rank":4},
  {"name":"Windshield Wipers","description":"Lying on your back with legs raised vertically, rotate legs side to side like windshield wipers.","form_cue":"Keep legs straight and together. Control the movement. Don't let feet touch the floor.","muscles":["obliques","core","hip flexors"],"difficulty":3,"category":"core","min_rank":4},

  // ─── PLYOMETRICS / POWER ──────────────────────────────────────
  {"name":"Broad Jump","description":"Standing long jump for maximum horizontal distance. Walk back to start for the next rep.","form_cue":"Swing arms back, load hips. Jump forward as far as you can. Land soft and balanced.","muscles":["quads","glutes","calves","core"],"difficulty":3,"category":"cardio","min_rank":2},
  {"name":"Box Jump (Step)","description":"Jump onto a sturdy step, low bench, or garden wall. Step back down to reset.","form_cue":"Load hips back, explode up. Land soft on the box in an athletic stance. Stand tall.","muscles":["quads","glutes","calves"],"difficulty":3,"category":"cardio","min_rank":3},
  {"name":"Clap Push-Up","description":"Explosive push-up where hands clap together at the top before catching the landing.","form_cue":"Push hard enough to clear the ground. Fast clap. Soft landing with bent elbows.","muscles":["chest","triceps","shoulders"],"difficulty":4,"category":"strength","min_rank":5},
  {"name":"Kneeling Jump to Stand","description":"Kneeling with tops of feet flat. Swing arms and explode up to land in a standing squat.","form_cue":"Swing arms hard, drive hips forward. Land in an athletic stance. Stand tall.","muscles":["glutes","quads","core"],"difficulty":3,"category":"cardio","min_rank":3},
  {"name":"Depth Jump","description":"Step off a low step, land softly, and immediately explode into a maximum vertical jump.","form_cue":"Step off, don't jump off. Minimize ground contact. Explode up immediately.","muscles":["quads","glutes","calves"],"difficulty":4,"category":"cardio","min_rank":4}
];

export async function POST() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the exercise names the user already has so we only insert
    // new entries. This lets the route act as a top-up when we add
    // exercises to the seed list over time.
    const { data: existingRows, error: fetchError } = await supabase
      .from("exercise_library")
      .select("name")
      .eq("user_id", user.id);

    if (fetchError) throw fetchError;

    const existingNames = new Set((existingRows ?? []).map((r) => r.name));
    const newExercises = EXERCISES.filter((ex) => !existingNames.has(ex.name));

    if (newExercises.length === 0) {
      return NextResponse.json({
        message: "Exercise library already up to date",
        existing: existingNames.size,
        added: 0,
      });
    }

    const rows = newExercises.map((ex) => ({
      ...ex,
      user_id: user.id,
      is_favourite: false,
    }));

    const { error: insertError } = await supabase
      .from("exercise_library")
      .insert(rows);

    if (insertError) throw insertError;

    return NextResponse.json({
      message: existingNames.size === 0
        ? `Seeded ${rows.length} exercises`
        : `Added ${rows.length} new exercises to library`,
      existing: existingNames.size,
      added: rows.length,
    });

  } catch (error) {
    console.error("Seed exercises error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to seed exercises" },
      { status: 500 }
    );
  }
}
