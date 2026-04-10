/* ============================================
   Exercise Instructions Library
   Detailed step-by-step breakdowns for each
   exercise. Used on the mission briefing page
   and during the workout player.

   Keys match the `name` field in the exercise
   library. Lookup via getExerciseInstructions(name).
   ============================================ */

export interface ExerciseInstructions {
  setup: string[];          // How to get into starting position
  execution: string[];      // Step-by-step execution (ordered)
  breathing: string;        // Breathing guidance
  commonMistakes: string[]; // What NOT to do
  tips: string[];           // Pro tips / modifications / scaling
}

export const EXERCISE_INSTRUCTIONS: Record<string, ExerciseInstructions> = {
  // ─── PUSH-UP VARIATIONS ───────────────────────────────
  "Standard Push-Up": {
    setup: [
      "Kneel on the floor and place your hands directly under your shoulders, slightly wider than shoulder-width.",
      "Extend both legs back and balance on your toes with feet hip-width apart.",
      "Brace your core so your body forms a straight line from head to heels.",
    ],
    execution: [
      "Bend your elbows at a 45-degree angle and lower your chest toward the floor.",
      "Stop when your chest is an inch from the ground.",
      "Push through your palms and lock out your elbows to return to the start.",
      "That's one rep.",
    ],
    breathing: "Inhale as you lower down, exhale as you press up.",
    commonMistakes: [
      "Sagging hips — keep your glutes squeezed and core tight.",
      "Piking hips up — don't turn it into a downward dog.",
      "Elbows flaring out at 90 degrees — keep them angled back.",
      "Half reps — get your chest all the way to the floor.",
    ],
    tips: [
      "Too hard? Drop your knees to the floor (knee push-ups).",
      "Too easy? Elevate your feet on a step to make it a decline push-up.",
      "Keep your gaze slightly forward, not straight down, for proper neck alignment.",
    ],
  },

  "Wide Push-Up": {
    setup: [
      "Get into a push-up position with hands placed 1.5x shoulder width apart.",
      "Fingers pointing forward, core braced, body in a straight line.",
    ],
    execution: [
      "Lower your chest toward the floor, keeping elbows at roughly 45 degrees.",
      "Stop when chest is just above the floor.",
      "Drive through your palms to press back up.",
    ],
    breathing: "Inhale down, exhale up.",
    commonMistakes: [
      "Flaring elbows out to 90 degrees — rough on shoulders.",
      "Not going deep enough — full range of motion is key.",
      "Hips sagging or piking.",
    ],
    tips: [
      "The wider stance puts more emphasis on the chest.",
      "Keep your head neutral, don't crane your neck to look up.",
    ],
  },

  "Diamond Push-Up": {
    setup: [
      "Start in a push-up position.",
      "Bring your hands together under your chest, thumbs and index fingers touching to form a diamond.",
      "Keep elbows close to your torso.",
    ],
    execution: [
      "Lower your chest down to your hands, elbows tracking along your sides.",
      "Pause briefly at the bottom with your chest just touching your hands.",
      "Press back up, fully extending your arms.",
    ],
    breathing: "Inhale down, exhale up.",
    commonMistakes: [
      "Elbows flaring out to the sides — defeats the tricep focus.",
      "Dropping the hips.",
      "Not going deep enough due to the harder range.",
    ],
    tips: [
      "This is significantly harder than a standard push-up — scale reps down.",
      "Progression from standard push-ups: start with knees on the floor.",
      "Keep your core engaged to prevent lower back strain.",
    ],
  },

  "Decline Push-Up": {
    setup: [
      "Find a stable elevated surface (step, bench, low wall) about 1-2 feet high.",
      "Place your feet on the surface and hands on the ground in push-up position.",
      "Brace your core — body should be a straight line.",
    ],
    execution: [
      "Lower your chest toward the ground, elbows at 45 degrees.",
      "Stop just before your chest touches.",
      "Push back up powerfully to the start.",
    ],
    breathing: "Inhale on the way down, exhale on the press.",
    commonMistakes: [
      "Letting the hips sag — harder to avoid with feet elevated.",
      "Using an unstable surface.",
      "Overarching the lower back.",
    ],
    tips: [
      "The higher the feet, the harder it gets — start with a low step.",
      "Shifts emphasis to upper chest and shoulders.",
    ],
  },

  "Pike Push-Up": {
    setup: [
      "Start in a push-up position.",
      "Walk your feet in toward your hands, raising your hips high into an inverted V.",
      "Arms straight, head between arms, looking at your feet.",
    ],
    execution: [
      "Bend your elbows and lower the top of your head toward the floor.",
      "Stop when your head is about an inch from the ground.",
      "Press through your palms to return to the pike position.",
    ],
    breathing: "Inhale lowering, exhale pressing up.",
    commonMistakes: [
      "Bending at the hips instead of the elbows.",
      "Not getting deep enough.",
      "Letting the elbows flare too wide.",
    ],
    tips: [
      "This is a great progression toward handstand push-ups.",
      "Elevate your feet on a step to increase difficulty.",
      "Targets the shoulders more than a flat push-up.",
    ],
  },

  "Archer Push-Up": {
    setup: [
      "Start in a wide push-up position, hands about double shoulder-width apart.",
      "Fingers point slightly outward.",
    ],
    execution: [
      "Bend one elbow and shift your weight toward that side, keeping the other arm straight.",
      "Lower until your shoulder is over your bent-arm wrist.",
      "Press back to centre, then repeat on the other side.",
      "Alternate sides — each dip counts as one rep.",
    ],
    breathing: "Inhale as you shift and lower, exhale as you press back to centre.",
    commonMistakes: [
      "Letting the straight arm bend — it should stay rigid for support.",
      "Rotating the hips — keep them square to the floor.",
      "Not going deep enough.",
    ],
    tips: [
      "This is a serious progression toward one-arm push-ups.",
      "Drop to knees to scale it down if needed.",
      "Control the descent — don't just drop.",
    ],
  },

  "Explosive Push-Up": {
    setup: [
      "Get into a standard push-up position.",
      "Brace your core hard — you need a rigid platform for the explosion.",
    ],
    execution: [
      "Lower into a push-up as normal.",
      "Explode upward with enough force that your hands leave the ground.",
      "Land softly on your palms with slightly bent elbows.",
      "Immediately lower into the next rep.",
    ],
    breathing: "Inhale on the way down, sharp exhale on the explosion up.",
    commonMistakes: [
      "Landing with locked elbows — risks injury.",
      "Slamming the hands down — control the landing.",
      "Losing core tension between reps.",
    ],
    tips: [
      "Start with just clearing the hands a few inches off the ground.",
      "Progress to clapping push-ups once you have the power.",
      "Always land soft and absorb through the elbows.",
    ],
  },

  "One-Arm Push-Up": {
    setup: [
      "Widen your feet well beyond shoulder width for a stable base.",
      "Place one hand on the floor under your shoulder, other hand behind your back or on your side.",
      "Rotate your torso slightly toward the working arm.",
    ],
    execution: [
      "Lower your chest toward the floor, keeping your body tight.",
      "Keep your hips as square as possible — minimise rotation.",
      "Press back up with full control.",
    ],
    breathing: "Inhale down slowly, powerful exhale on the press.",
    commonMistakes: [
      "Twisting the hips to cheat the movement.",
      "Feet too close together — you need a wide base.",
      "Rushing the descent.",
    ],
    tips: [
      "Elite-level exercise — only attempt after mastering archer push-ups.",
      "Your feet can be as wide as a full split to start.",
      "Scale down with one-arm push-ups against a wall.",
    ],
  },

  // ─── SQUAT VARIATIONS ─────────────────────────────────
  "Bodyweight Squat": {
    setup: [
      "Stand tall with feet shoulder-width apart, toes pointing slightly outward (10-15 degrees).",
      "Arms can hang at your sides or extend forward for counterbalance.",
      "Engage your core and keep your chest proud.",
    ],
    execution: [
      "Push your hips back as if sitting into a chair behind you.",
      "Bend your knees, letting them track in line with your toes.",
      "Lower until your thighs are parallel to the floor (or deeper if mobility allows).",
      "Drive through your heels to stand back up.",
    ],
    breathing: "Inhale as you descend, exhale as you stand up.",
    commonMistakes: [
      "Knees caving inward — push them out over your toes.",
      "Heels lifting off the floor — widen stance or work on ankle mobility.",
      "Rounding the lower back at the bottom.",
      "Leaning too far forward — keep your chest up.",
    ],
    tips: [
      "Beginners: use a chair or bench behind you to squat down to.",
      "Depth over speed — get to parallel before counting the rep.",
      "Spread the floor apart with your feet to engage the glutes.",
    ],
  },

  "Jump Squat": {
    setup: [
      "Start in the bottom of a bodyweight squat, thighs parallel.",
      "Arms back, ready to swing for momentum.",
    ],
    execution: [
      "Explode upward off the floor, extending hips, knees, and ankles.",
      "Swing your arms forward and up to assist the jump.",
      "Land softly on the balls of your feet, absorbing through bent knees.",
      "Immediately lower back into the squat to chain reps.",
    ],
    breathing: "Exhale sharply on the jump, inhale on the landing and descent.",
    commonMistakes: [
      "Landing stiff-legged — always bend knees to absorb.",
      "Landing on the heels — balls of feet first.",
      "Not getting deep enough before the jump.",
    ],
    tips: [
      "Land as quietly as possible — it forces good mechanics.",
      "Rest between sets to maintain explosive power.",
      "Scale down by doing bodyweight squats with a rise on your toes.",
    ],
  },

  "Sumo Squat": {
    setup: [
      "Stand with feet wider than shoulder-width apart.",
      "Point your toes outward at a 45-degree angle.",
      "Clasp hands at chest level or extend arms forward.",
    ],
    execution: [
      "Keeping your torso as upright as possible, push your hips straight down.",
      "Lower until your thighs are parallel or below.",
      "Drive through the whole foot to stand up.",
    ],
    breathing: "Inhale down, exhale up.",
    commonMistakes: [
      "Letting knees collapse inward.",
      "Leaning forward too much — keep chest high.",
      "Not going deep enough.",
    ],
    tips: [
      "Targets inner thighs and glutes more than a standard squat.",
      "Feet wider means more stretch on the adductors.",
    ],
  },

  "Pistol Squat (Assisted)": {
    setup: [
      "Stand next to a wall, doorframe, or sturdy post.",
      "Hold on lightly with one hand for balance.",
      "Extend one leg straight out in front of you.",
    ],
    execution: [
      "Slowly lower on the standing leg, sliding the opposite leg forward.",
      "Keep the extended leg off the ground throughout.",
      "Lower until your glutes are near your heel, then drive back up.",
      "Complete all reps on one side before switching.",
    ],
    breathing: "Inhale lowering, exhale on the drive back up.",
    commonMistakes: [
      "Pulling too hard on the support — use it for balance only.",
      "Letting the standing knee cave in.",
      "Rushing the descent.",
    ],
    tips: [
      "This is a serious strength and mobility test — don't rush progression.",
      "Start by squatting to a chair on one leg to build the pattern.",
      "Heels up on a weight plate or book helps if ankle mobility is limited.",
    ],
  },

  "Wall Sit": {
    setup: [
      "Stand with your back flat against a wall.",
      "Walk your feet out about 2 feet, shoulder-width apart.",
      "Slide down the wall until your thighs are parallel to the floor.",
    ],
    execution: [
      "Knees should be directly over your ankles at a 90-degree angle.",
      "Keep your entire back pressed flat against the wall.",
      "Arms at sides or crossed — do not rest them on your thighs.",
      "Hold the position for the prescribed time.",
    ],
    breathing: "Breathe steadily and slowly — don't hold your breath.",
    commonMistakes: [
      "Hands on thighs for support (cheating).",
      "Knees past the toes — step feet further out.",
      "Rising up as it gets hard — stay at 90 degrees.",
    ],
    tips: [
      "Pure isometric burn — expect legs to shake.",
      "Scale by sitting a little higher (knees at 120 degrees).",
      "Great for building strength endurance in the quads.",
    ],
  },

  // ─── LUNGE VARIATIONS ─────────────────────────────────
  "Forward Lunge": {
    setup: [
      "Stand tall with feet hip-width apart.",
      "Hands on hips or at sides.",
      "Core engaged, chest up.",
    ],
    execution: [
      "Take a long step forward with one leg.",
      "Lower your back knee straight down toward the floor.",
      "Stop when both knees are at 90 degrees.",
      "Push off the front foot to return to standing. Alternate legs.",
    ],
    breathing: "Inhale as you step and lower, exhale as you push back up.",
    commonMistakes: [
      "Front knee tracking over the toes — keep the shin vertical.",
      "Back knee slamming into the floor — control the descent.",
      "Leaning forward — keep your torso upright.",
    ],
    tips: [
      "Take a bigger step if your front knee goes past your toes.",
      "Alternate legs each rep or complete all reps on one side.",
      "Harder on the knees than reverse lunges — scale back if needed.",
    ],
  },

  "Reverse Lunge": {
    setup: [
      "Stand tall, feet hip-width apart.",
      "Core braced, chest up.",
    ],
    execution: [
      "Step one foot back into a lunge position.",
      "Lower until both knees reach 90 degrees.",
      "Drive through the front heel to return to standing.",
      "Alternate legs each rep.",
    ],
    breathing: "Inhale stepping back, exhale driving up.",
    commonMistakes: [
      "Rushing the step — take controlled, measured steps.",
      "Front knee caving inward.",
      "Short steps — your stance should feel stretched.",
    ],
    tips: [
      "Easier on the knees than forward lunges.",
      "Great starting point if you're new to lunges.",
      "Focus on driving through the front heel to engage glutes.",
    ],
  },

  "Walking Lunge": {
    setup: [
      "Stand at one end of a clear space (about 10-20 feet).",
      "Hands on hips or at sides.",
    ],
    execution: [
      "Step forward into a lunge, lowering until both knees are at 90 degrees.",
      "Instead of returning, step the back foot forward into the next lunge.",
      "Continue walking forward, alternating legs with each step.",
    ],
    breathing: "Steady breathing — inhale lowering, exhale driving up.",
    commonMistakes: [
      "Rushing — walking lunges should be slow and deliberate.",
      "Short steps that turn into marching.",
      "Torso collapsing forward.",
    ],
    tips: [
      "If space is tight, just do alternating reverse lunges instead.",
      "Great for single-leg endurance.",
      "Keep your core tight to maintain balance during transitions.",
    ],
  },

  "Jump Lunge": {
    setup: [
      "Start in a lunge position with one leg forward, knees at 90 degrees.",
    ],
    execution: [
      "Explode upward, switching legs in mid-air.",
      "Land with the opposite leg forward.",
      "Immediately lower into the next lunge.",
      "Keep the rhythm going — each landing is one rep.",
    ],
    breathing: "Sharp exhale on each jump.",
    commonMistakes: [
      "Landing stiff — always bend the knees to absorb.",
      "Short jumps — fully commit to the switch.",
      "Losing form when fatigued.",
    ],
    tips: [
      "This is serious cardio as well as strength.",
      "Regress to alternating forward lunges if form breaks down.",
      "Land softly — minimal noise means good mechanics.",
    ],
  },

  "Lateral Lunge": {
    setup: [
      "Stand tall with feet together.",
      "Hands at chest or on hips.",
    ],
    execution: [
      "Take a wide step out to one side.",
      "Bend the stepping knee and push your hips back — keep the other leg straight.",
      "Lower until your bent knee is at 90 degrees.",
      "Push off and return to standing. Alternate sides.",
    ],
    breathing: "Inhale stepping out, exhale returning.",
    commonMistakes: [
      "Not stepping wide enough — you need a big lateral step.",
      "Letting the heel of the straight leg lift.",
      "Rounding the lower back.",
    ],
    tips: [
      "Targets inner thighs and glutes from a different angle.",
      "Great for athletic movement patterns.",
      "Keep your chest up throughout.",
    ],
  },

  // ─── CORE EXERCISES ──────────────────────────────────
  "Plank": {
    setup: [
      "Place your forearms flat on the ground, elbows directly under your shoulders.",
      "Extend your legs back, balancing on your toes.",
      "Body should form a perfectly straight line from head to heels.",
    ],
    execution: [
      "Squeeze your glutes, brace your core, and tuck your pelvis slightly.",
      "Hold the position with steady breathing.",
      "Maintain the straight line for the full duration.",
    ],
    breathing: "Slow, controlled breaths — never hold your breath.",
    commonMistakes: [
      "Hips sagging toward the floor.",
      "Hips piking up into a downward dog position.",
      "Head dropping — keep your neck neutral.",
      "Shaking uncontrollably — drop to knees if form breaks.",
    ],
    tips: [
      "Imagine pulling your belly button toward your spine.",
      "A perfect 30-second plank beats a shaky 2-minute one.",
      "Scale by dropping to your knees.",
    ],
  },

  "Side Plank": {
    setup: [
      "Lie on your side, legs extended and stacked (or staggered for easier).",
      "Place your forearm on the floor, elbow directly under your shoulder.",
      "Stack your hips and shoulders.",
    ],
    execution: [
      "Lift your hips off the floor so your body forms a straight line.",
      "Keep your top arm extended upward or on your hip.",
      "Hold for the prescribed time, then switch sides.",
    ],
    breathing: "Controlled breathing throughout the hold.",
    commonMistakes: [
      "Hips dropping toward the floor.",
      "Shoulders rolling forward.",
      "Elbow not directly under the shoulder.",
    ],
    tips: [
      "Stagger your feet (one in front of the other) for easier balance.",
      "Drop to the bottom knee for a significant regression.",
      "Targets the obliques hard.",
    ],
  },

  "Plank Shoulder Taps": {
    setup: [
      "Start in a high plank (push-up position), hands under shoulders.",
      "Feet slightly wider than hip-width for stability.",
      "Brace your core tight.",
    ],
    execution: [
      "Lift one hand and tap the opposite shoulder.",
      "Return that hand to the floor.",
      "Repeat with the other hand.",
      "Alternate for the prescribed reps or time.",
    ],
    breathing: "Steady breathing — don't hold your breath.",
    commonMistakes: [
      "Hips rocking from side to side — biggest giveaway of weak core.",
      "Rushing — this is an anti-rotation exercise, go slow.",
      "Letting hips sag.",
    ],
    tips: [
      "Widen your feet for more stability.",
      "The goal is to keep the hips completely still.",
      "Slower is harder — take your time.",
    ],
  },

  "Up-Down Plank": {
    setup: [
      "Start in a forearm plank, elbows under shoulders.",
      "Feet hip-width apart, core braced.",
    ],
    execution: [
      "Press up one arm at a time into a high plank.",
      "Then lower back down one arm at a time to the forearm plank.",
      "Alternate which arm leads each rep.",
    ],
    breathing: "Controlled breathing — exhale on the effort.",
    commonMistakes: [
      "Rocking the hips side to side.",
      "Rushing the transitions.",
      "Arms going out too wide.",
    ],
    tips: [
      "Move slowly and deliberately.",
      "Keep feet wide for more stability.",
      "Great combo of core and shoulder endurance.",
    ],
  },

  "Bicycle Crunch": {
    setup: [
      "Lie on your back with hands lightly behind your head.",
      "Lift your knees up to 90 degrees and lift your shoulder blades off the floor.",
    ],
    execution: [
      "Rotate your torso to bring one elbow toward the opposite knee.",
      "Simultaneously extend the other leg straight out.",
      "Switch sides smoothly — opposite elbow to opposite knee.",
      "Each touch counts as one rep.",
    ],
    breathing: "Exhale on each crunch, inhale during the switch.",
    commonMistakes: [
      "Pulling on the neck — hands are just a light support.",
      "Flaring elbows forward — keep them wide.",
      "Rushing — controlled tempo is more effective.",
    ],
    tips: [
      "Think about rotating from your core, not your arms.",
      "Fully extend the straight leg on each rep.",
      "Keep your lower back pressed into the floor.",
    ],
  },

  "Leg Raises": {
    setup: [
      "Lie flat on your back with legs extended.",
      "Hands at your sides or under your glutes for lower back support.",
    ],
    execution: [
      "Keeping legs straight, raise them up to vertical (90 degrees).",
      "Slowly lower them back down — pause just before they touch the floor.",
      "Immediately begin the next rep without resting on the floor.",
    ],
    breathing: "Exhale raising, inhale lowering.",
    commonMistakes: [
      "Lower back arching off the floor — biggest risk of injury.",
      "Swinging the legs for momentum.",
      "Bending the knees.",
    ],
    tips: [
      "Press your lower back into the floor throughout.",
      "If your back arches, lower legs only to where you can control.",
      "Bend knees slightly to scale down.",
    ],
  },

  "Flutter Kicks": {
    setup: [
      "Lie flat on your back, legs straight.",
      "Hands under your glutes for lower back support.",
      "Lift legs 6 inches off the ground.",
    ],
    execution: [
      "Alternately kick your legs up and down in small, rapid movements.",
      "Keep the legs straight and the motion fluid.",
      "Maintain throughout the prescribed duration.",
    ],
    breathing: "Steady breathing throughout.",
    commonMistakes: [
      "Lower back arching off the floor.",
      "Big, swinging kicks instead of small controlled ones.",
      "Letting the feet touch the floor.",
    ],
    tips: [
      "Press your lower back into the floor.",
      "Scale down by bending knees slightly.",
      "Small, fast kicks are better than large, slow ones.",
    ],
  },

  "V-Up": {
    setup: [
      "Lie flat on your back with arms extended overhead.",
      "Legs straight, body in a long line.",
    ],
    execution: [
      "Simultaneously raise your legs and torso off the ground.",
      "Reach your hands toward your toes at the top — forming a V shape.",
      "Lower back to the start with control.",
    ],
    breathing: "Exhale on the way up, inhale on the way down.",
    commonMistakes: [
      "Using momentum instead of muscle.",
      "Bending the knees.",
      "Not meeting at the top.",
    ],
    tips: [
      "Scale by bending the knees (tuck-up).",
      "Keep arms and legs straight for the full V shape.",
      "Move with control — no flopping back down.",
    ],
  },

  "Dead Bug": {
    setup: [
      "Lie on your back with arms extended straight up toward the ceiling.",
      "Lift your knees to 90 degrees so shins are parallel to the floor.",
      "Press your lower back flat into the floor.",
    ],
    execution: [
      "Slowly extend one arm overhead and lower the opposite leg until both hover above the floor.",
      "Return to start with control.",
      "Alternate with the other arm and leg.",
    ],
    breathing: "Exhale as you extend, inhale as you return.",
    commonMistakes: [
      "Lower back lifting off the floor — the whole point is to prevent this.",
      "Moving too fast.",
      "Holding your breath.",
    ],
    tips: [
      "Slower is harder and more effective.",
      "If your back lifts, reduce the range of motion.",
      "Excellent for teaching core stability.",
    ],
  },

  // ─── CARDIO ──────────────────────────────────────────
  "Mountain Climber": {
    setup: [
      "Start in a high plank position, hands directly under your shoulders.",
      "Body in a straight line, core braced.",
    ],
    execution: [
      "Drive one knee toward your chest.",
      "Quickly switch — send that foot back and drive the other knee forward.",
      "Maintain a rapid pace, like running in place horizontally.",
    ],
    breathing: "Quick, steady breathing — find a rhythm.",
    commonMistakes: [
      "Hips piking up as you tire.",
      "Hands sliding out of position.",
      "Slowing down — maintain the tempo.",
    ],
    tips: [
      "Keep your core tight to prevent hip bounce.",
      "Mix up the pace — slow and controlled or fast and furious.",
      "Can be done to time or reps.",
    ],
  },

  "Burpee": {
    setup: [
      "Stand tall with feet shoulder-width apart.",
    ],
    execution: [
      "Squat down and place your hands on the floor.",
      "Jump your feet back into a plank position.",
      "Perform a full push-up, chest to the floor.",
      "Jump your feet back toward your hands.",
      "Explode up into a jump with arms overhead.",
      "Land softly and immediately begin the next rep.",
    ],
    breathing: "Quick exhales on each explosive movement.",
    commonMistakes: [
      "Sagging hips in the plank.",
      "Skipping the push-up or jump.",
      "Landing heavy on the jumps.",
    ],
    tips: [
      "This is the king of cardio — pace yourself.",
      "Scale by eliminating the push-up (Burpee No Push-Up).",
      "Focus on smooth transitions between phases.",
    ],
  },

  "Burpee (No Push-Up)": {
    setup: [
      "Stand with feet shoulder-width apart.",
    ],
    execution: [
      "Squat down, hands on floor.",
      "Jump your feet back into a plank.",
      "Immediately jump your feet back to your hands.",
      "Stand up and jump, arms overhead.",
      "Land softly and repeat.",
    ],
    breathing: "Rhythmic, quick breathing.",
    commonMistakes: [
      "Plank is sloppy and collapsed.",
      "Small, half-hearted jumps at the top.",
      "Slowing down in the transitions.",
    ],
    tips: [
      "Maintain a fast, consistent pace.",
      "Great scaling option when the push-up version is too much.",
      "Focus on making each jump count.",
    ],
  },

  "Bear Crawl": {
    setup: [
      "Start on hands and knees.",
      "Lift your knees about 1 inch off the floor.",
      "Back flat, core braced.",
    ],
    execution: [
      "Move forward by advancing your opposite hand and foot together.",
      "Keep your knees hovering just off the ground throughout.",
      "Stay low — hips should not rise.",
      "Cover the prescribed distance or time.",
    ],
    breathing: "Steady breathing — don't hold your breath.",
    commonMistakes: [
      "Hips rising too high.",
      "Moving same-side limbs together.",
      "Rushing — slow is stronger.",
    ],
    tips: [
      "Imagine staying under a low ceiling.",
      "Brutal on the shoulders and core.",
      "Great for coordination and conditioning.",
    ],
  },

  "High Knees": {
    setup: [
      "Stand tall with feet hip-width apart.",
      "Arms bent at 90 degrees like a runner.",
    ],
    execution: [
      "Drive one knee up to waist height.",
      "Quickly switch, driving the other knee up.",
      "Pump your arms like you're sprinting.",
      "Stay on the balls of your feet throughout.",
    ],
    breathing: "Quick, rhythmic breathing.",
    commonMistakes: [
      "Not driving knees high enough — at least to waist level.",
      "Leaning back — stay upright or slightly forward.",
      "Landing flat-footed.",
    ],
    tips: [
      "Think about 'sprinting in place.'",
      "Use your arms — they drive the pace.",
      "Great as a warm-up or a finisher.",
    ],
  },

  "Star Jump": {
    setup: [
      "Start in a low squat with arms tucked at your sides or in front.",
    ],
    execution: [
      "Explode upward, reaching arms and legs out wide — making a star shape.",
      "Land softly back into the low squat position.",
      "Immediately explode into the next rep.",
    ],
    breathing: "Sharp exhale on each jump.",
    commonMistakes: [
      "Not getting low enough on the landing.",
      "Landing stiff — bend knees to absorb.",
      "Half-hearted star shape at the peak.",
    ],
    tips: [
      "Full commitment on the star — really spread out at the top.",
      "Great full-body cardio exercise.",
      "Scale by reducing the depth of the squat.",
    ],
  },

  "Tuck Jump": {
    setup: [
      "Stand with feet shoulder-width apart, knees slightly bent.",
    ],
    execution: [
      "Jump as high as you can.",
      "At the peak, pull your knees up toward your chest.",
      "Slap your thighs or touch your shins if possible.",
      "Land softly with bent knees.",
      "Immediately jump again.",
    ],
    breathing: "Sharp exhale on each jump.",
    commonMistakes: [
      "Leaning forward to meet the knees instead of lifting them.",
      "Landing on straight legs.",
      "Losing height as you fatigue.",
    ],
    tips: [
      "Drive the knees up — don't drop the chest.",
      "Use arms for momentum.",
      "Maximum power exercise — take rest between sets.",
    ],
  },

  "Shadow Boxing": {
    setup: [
      "Stand in a fighting stance: dominant foot back, lead foot forward.",
      "Hands up at chin level, elbows tucked.",
      "Stay light on your feet.",
    ],
    execution: [
      "Throw combinations: jab, cross, hook, uppercut.",
      "Rotate your hips into each punch.",
      "Stay light on your feet — bounce and pivot.",
      "Keep hands up and return to guard after each punch.",
    ],
    breathing: "Sharp exhale with each punch.",
    commonMistakes: [
      "Dropping hands after punching.",
      "Punching with just the arms — rotate the hips.",
      "Flat-footed stance.",
    ],
    tips: [
      "Imagine an opponent in front of you.",
      "Mix up combinations — don't just throw single shots.",
      "Great cardio with zero impact.",
    ],
  },

  // ─── GLUTES & POSTERIOR CHAIN ────────────────────────
  "Glute Bridge": {
    setup: [
      "Lie on your back with knees bent and feet flat on the floor, hip-width apart.",
      "Arms at your sides, palms down.",
    ],
    execution: [
      "Drive through your heels to lift your hips off the floor.",
      "Squeeze your glutes hard at the top.",
      "Your body should form a straight line from shoulders to knees.",
      "Lower with control and repeat.",
    ],
    breathing: "Exhale driving up, inhale lowering.",
    commonMistakes: [
      "Pushing through the toes instead of heels.",
      "Overextending the lower back at the top.",
      "Not squeezing the glutes.",
    ],
    tips: [
      "Imagine a quarter between your glutes — squeeze to hold it.",
      "Pause at the top for extra burn.",
      "Foundational glute exercise — master this first.",
    ],
  },

  "Single Leg Glute Bridge": {
    setup: [
      "Lie on your back with one knee bent, foot flat.",
      "Extend the other leg straight out.",
    ],
    execution: [
      "Drive through the planted heel to lift your hips.",
      "Keep the extended leg straight, forming a line with your torso.",
      "Squeeze the working glute hard at the top.",
      "Lower with control.",
    ],
    breathing: "Exhale up, inhale down.",
    commonMistakes: [
      "Hips tilting to the side — keep them level.",
      "Lower back taking over — focus on the glute.",
      "Pushing off the extended leg.",
    ],
    tips: [
      "Keep hips completely level throughout.",
      "One leg at a time doubles the load per side.",
      "Great unilateral exercise for fixing imbalances.",
    ],
  },

  "Calf Raise": {
    setup: [
      "Stand on the edge of a step with your heels hanging off.",
      "Hold onto something for balance if needed.",
    ],
    execution: [
      "Push up onto the balls of your feet as high as possible.",
      "Pause at the top and squeeze the calves.",
      "Lower all the way down so your heels drop below the step.",
      "Full range of motion each rep.",
    ],
    breathing: "Exhale up, inhale down.",
    commonMistakes: [
      "Rushing — slow reps with full ROM work better.",
      "Not getting a full stretch at the bottom.",
      "Bending the knees.",
    ],
    tips: [
      "Pause for 1 second at the top.",
      "Work single-leg once two-leg is too easy.",
      "The stretch at the bottom is where growth happens.",
    ],
  },

  "Step-Up": {
    setup: [
      "Stand in front of a sturdy bench, wall, or step (knee-height ideal).",
      "Hands on hips or at sides.",
    ],
    execution: [
      "Place one foot firmly on the step.",
      "Drive through that heel to stand up fully on the step.",
      "Control the descent as you step back down.",
      "Complete all reps on one side, then switch.",
    ],
    breathing: "Exhale driving up, inhale stepping down.",
    commonMistakes: [
      "Pushing off the back foot — all the work should be in the front leg.",
      "Slamming the back foot down.",
      "Using a surface that's too high — knee should start at 90 degrees.",
    ],
    tips: [
      "Drive through the heel, not the toes.",
      "The back leg is just along for the ride.",
      "Higher step = harder exercise.",
    ],
  },

  "Tricep Dip (Bench)": {
    setup: [
      "Sit on the edge of a bench, step, or sturdy chair.",
      "Place your hands next to your hips, fingers pointing forward.",
      "Extend your legs out (easier) or place feet on the floor bent.",
      "Slide your hips off the bench.",
    ],
    execution: [
      "Bend your elbows straight back to lower your body.",
      "Stop when your elbows are at 90 degrees.",
      "Press through your palms to straighten your arms.",
    ],
    breathing: "Inhale down, exhale up.",
    commonMistakes: [
      "Elbows flaring out to the sides.",
      "Shoulders hunching up toward the ears.",
      "Not going low enough.",
    ],
    tips: [
      "Scale by bending your knees with feet flat on the floor.",
      "Advance by straightening legs or elevating feet on another surface.",
      "Keep your shoulders down and back.",
    ],
  },

  "Superman": {
    setup: [
      "Lie face down on the floor with arms extended overhead.",
      "Legs straight, toes pointed.",
    ],
    execution: [
      "Simultaneously lift your arms, chest, and legs off the floor.",
      "Squeeze your glutes and upper back.",
      "Hold for 1-2 seconds at the top.",
      "Lower back down with control.",
    ],
    breathing: "Exhale lifting, inhale lowering.",
    commonMistakes: [
      "Over-cranking the lower back.",
      "Not actually lifting anything — go as high as you can.",
      "Holding the breath.",
    ],
    tips: [
      "Think about lengthening, not just lifting.",
      "Great for counteracting sitting posture.",
      "Builds lower back endurance.",
    ],
  },

  "Reverse Snow Angel": {
    setup: [
      "Lie face down with arms at your sides, palms down.",
      "Legs straight.",
    ],
    execution: [
      "Lift your arms slightly off the floor.",
      "Sweep your arms from your hips, out to the sides, and up overhead.",
      "Reverse the motion back to your hips — arms never touch the floor.",
      "Keep arms straight throughout.",
    ],
    breathing: "Exhale on the sweep, inhale on the return.",
    commonMistakes: [
      "Arms touching the floor during the sweep.",
      "Using momentum instead of muscles.",
      "Bending the elbows.",
    ],
    tips: [
      "Squeeze your upper back throughout.",
      "Slow and controlled — this is an endurance exercise.",
      "Great for upper back and posture.",
    ],
  },

  "Prone Y-Raise": {
    setup: [
      "Lie face down with arms extended overhead in a Y shape.",
      "Thumbs pointing up toward the ceiling.",
    ],
    execution: [
      "Lift your arms off the floor, squeezing your upper back.",
      "Hold for 1 second at the top.",
      "Lower with control.",
    ],
    breathing: "Exhale lifting, inhale lowering.",
    commonMistakes: [
      "Using momentum.",
      "Thumbs pointing down — keeps them up.",
      "Lifting with the lower back instead of the upper back.",
    ],
    tips: [
      "Think about pulling your shoulder blades down and together.",
      "The height doesn't matter — the contraction does.",
      "Great shoulder and upper back builder.",
    ],
  },

  "Inchworm": {
    setup: [
      "Stand tall with feet hip-width apart.",
    ],
    execution: [
      "Hinge forward and place your hands on the floor.",
      "Walk your hands out until you reach a full plank position.",
      "Hold briefly in the plank.",
      "Walk your feet toward your hands.",
      "Stand back up. Repeat, moving forward.",
    ],
    breathing: "Breathe steadily throughout.",
    commonMistakes: [
      "Bending the knees excessively — keep legs as straight as possible.",
      "Sagging hips in the plank position.",
      "Rushing the hand walk.",
    ],
    tips: [
      "Great dynamic warm-up exercise.",
      "Add a push-up at the plank position for extra challenge.",
      "Keep your core tight in the plank.",
    ],
  },

  "Sprawl": {
    setup: [
      "Stand tall with feet shoulder-width apart.",
    ],
    execution: [
      "Drop your hands to the floor and kick your feet back into a plank.",
      "Let your hips briefly touch the ground.",
      "Immediately push back up and jump your feet forward.",
      "Stand up fully.",
    ],
    breathing: "Sharp exhale on the drop, inhale standing.",
    commonMistakes: [
      "Skipping the hip touch.",
      "Slow transitions — this should be fast.",
      "Sloppy plank position.",
    ],
    tips: [
      "Like a burpee without the jump or push-up — great for conditioning.",
      "Speed matters — keep the pace high.",
      "Used in combat sports for takedown defence drills.",
    ],
  },

  "Skater Jump": {
    setup: [
      "Stand on one leg with a slight bend in the knee.",
      "Hold the other leg behind you.",
    ],
    execution: [
      "Push off the standing leg and leap sideways.",
      "Land softly on the other leg, crossing the trailing leg behind.",
      "Immediately push off again in the opposite direction.",
      "Stay low and athletic.",
    ],
    breathing: "Steady, rhythmic breathing.",
    commonMistakes: [
      "Not getting low enough.",
      "Short jumps — commit to the lateral distance.",
      "Landing stiff-legged.",
    ],
    tips: [
      "Swing arms across your body for momentum.",
      "Great for lateral power and balance.",
      "Start with smaller jumps and build up distance.",
    ],
  },

  "Sprint (Garden)": {
    setup: [
      "Mark out a 10-20 metre straight line.",
      "Start in an athletic stance at one end.",
    ],
    execution: [
      "Sprint as fast as possible to the other end.",
      "Drive your arms hard, knees high.",
      "Stay on the balls of your feet.",
      "Walk back to the start as your rest.",
    ],
    breathing: "Hold breath briefly on the sprint, recover on the walk back.",
    commonMistakes: [
      "Not going all-out — sprints must be maximum effort.",
      "Overstriding — keep feet under you.",
      "Starting cold — warm up first!",
    ],
    tips: [
      "Always warm up thoroughly before sprinting.",
      "Quality over quantity — rest fully between sprints.",
      "Great for power, speed, and conditioning.",
    ],
  },

  // ─── RECOVERY / FLEXIBILITY ─────────────────────────
  "Child's Pose": {
    setup: [
      "Kneel on the floor with your knees wide and big toes touching.",
      "Sit your hips back onto your heels.",
    ],
    execution: [
      "Fold forward and rest your forehead on the floor.",
      "Extend your arms forward or let them rest at your sides.",
      "Breathe deeply and sink into the stretch.",
    ],
    breathing: "Deep, slow breathing — inhale through nose, exhale through mouth.",
    commonMistakes: [
      "Knees too close together — widen them.",
      "Tensing up — relax into the pose.",
      "Rushing through it.",
    ],
    tips: [
      "Excellent rest pose between harder movements.",
      "Walk your hands to one side for a deeper oblique stretch.",
      "Hold for as long as you need to recover.",
    ],
  },

  "Downward Dog": {
    setup: [
      "Start on hands and knees.",
      "Hands shoulder-width apart, knees hip-width apart.",
    ],
    execution: [
      "Tuck your toes and lift your hips up and back.",
      "Straighten your legs (or keep a slight bend).",
      "Press your heels toward the floor.",
      "Let your head hang naturally between your arms.",
    ],
    breathing: "Slow, deep breathing throughout the hold.",
    commonMistakes: [
      "Hunching the shoulders.",
      "Locking the knees hard.",
      "Trying to force heels to the floor — they'll come down with time.",
    ],
    tips: [
      "Pedal your feet to loosen calves.",
      "Focus on lengthening the spine, not forcing heels down.",
      "Great full-body stretch.",
    ],
  },

  "Cat-Cow Stretch": {
    setup: [
      "Start on hands and knees.",
      "Hands under shoulders, knees under hips.",
      "Back flat to begin.",
    ],
    execution: [
      "Cat: Round your back up toward the ceiling, tuck your chin.",
      "Cow: Drop your belly toward the floor, lift your head and tail.",
      "Flow smoothly between the two positions.",
    ],
    breathing: "Inhale on cow (arch down), exhale on cat (round up).",
    commonMistakes: [
      "Rushing through the movements.",
      "Only moving the head — move the whole spine.",
      "Holding your breath.",
    ],
    tips: [
      "Move slowly — it's about mobility, not speed.",
      "Great warm-up for the spine.",
      "Sync the movement with your breath.",
    ],
  },

  "Hip Flexor Stretch": {
    setup: [
      "Kneel on one knee with the other foot flat on the floor in front.",
      "Both knees at 90 degrees.",
    ],
    execution: [
      "Keeping your torso upright, push your hips forward gently.",
      "Feel the stretch in the front of the back-leg hip.",
      "Hold for the prescribed time, then switch sides.",
    ],
    breathing: "Deep breathing into the stretch.",
    commonMistakes: [
      "Leaning forward — stay upright.",
      "Arching the lower back.",
      "Not squeezing the glute of the kneeling leg.",
    ],
    tips: [
      "Squeeze the glute to protect the lower back.",
      "Raise the same-side arm overhead for a deeper stretch.",
      "Essential for anyone who sits a lot.",
    ],
  },

  "Standing Quad Stretch": {
    setup: [
      "Stand tall. Hold a wall or chair if balance is an issue.",
    ],
    execution: [
      "Bend one knee and grab your foot with the same-side hand.",
      "Pull your heel toward your glute.",
      "Keep knees together and stand tall.",
      "Hold, then switch sides.",
    ],
    breathing: "Slow, deep breathing.",
    commonMistakes: [
      "Letting the knee drift forward or outward.",
      "Leaning forward.",
      "Pulling too aggressively.",
    ],
    tips: [
      "Squeeze the glute of the stretching leg.",
      "Keep knees close together.",
      "Great post-run or post-leg-day stretch.",
    ],
  },

  "Hamstring Stretch": {
    setup: [
      "Stand in front of a low step, curb, or sturdy box.",
      "Place one heel on the step, leg straight.",
    ],
    execution: [
      "Keep the elevated leg straight.",
      "Hinge at the hips and lean forward slightly.",
      "Feel the stretch along the back of the thigh.",
      "Hold, then switch sides.",
    ],
    breathing: "Slow, deep breathing into the stretch.",
    commonMistakes: [
      "Rounding the back — hinge at the hips.",
      "Bending the stretching knee.",
      "Pushing too hard into the stretch.",
    ],
    tips: [
      "The lower the surface, the easier; higher = deeper stretch.",
      "Point the toe up for calf stretch too.",
      "Don't bounce — hold the stretch still.",
    ],
  },
};

/**
 * Get detailed instructions for an exercise by name.
 * Returns null if the exercise isn't in the library — callers can fall
 * back to the exercise's own description/form_cue fields.
 */
export function getExerciseInstructions(name: string): ExerciseInstructions | null {
  return EXERCISE_INSTRUCTIONS[name] ?? null;
}
