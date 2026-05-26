import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Trash2, Dumbbell, Info, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { Exercise } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ExerciseLibraryProps {
  exercises: Exercise[];
  onAddExercise: (exercise: Omit<Exercise, 'id'>) => void;
  onDeleteExercise: (id: string) => void;
}

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body', 'Cardio'];
const EQUIPMENT_TYPES = ['All', 'Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight', 'Band'];

const EXERCISE_GUIDANCE: Record<string, {
  formTips: string[];
  goal: 'Strength' | 'Hypertrophy' | 'Endurance' | 'Mobility' | 'Power';
  repRange: string;
  intensity: 'Low' | 'Moderate' | 'High' | 'Very High';
  ptNote: string;
}> = {
  'Barbell Squat': {
    formTips: ['Feet shoulder-width apart, toes slightly outward','Brace core before descending','Keep chest up, drive through heels','Depth: hips below parallel'],
    goal: 'Strength',
    repRange: '4-8 reps',
    intensity: 'High',
    ptNote: 'The king of lower body. Drive through your heels and keep your chest proud. Start with goblet squats if mobility is limited.',
  },
  'Barbell Deadlift': {
    formTips: ['Bar over mid-foot','Hinge at hips, keep back neutral','Drive floor away, lockout at top','Do not round lower back'],
    goal: 'Strength',
    repRange: '3-6 reps',
    intensity: 'High',
    ptNote: 'Posterior chain powerhouse. If you feel it in your lower back, drop weight and focus on the hip hinge. Romanian deadlifts are a safer beginner option.',
  },
  'Bench Press': {
    formTips: ['Retract scapulae (squeeze shoulder blades)','Bar path: slight J-curve down to sternum','Elbows tuck ~45° at bottom','Drive feet into floor for leg drive'],
    goal: 'Strength',
    repRange: '4-8 reps',
    intensity: 'High',
    ptNote: 'The foundational chest builder. Keep your shoulder blades pinned and use controlled negatives. Do not bounce the bar off your chest.',
  },
  'Pull-Up': {
    formTips: ['Full dead hang at bottom','Initiate with scapular depression','Drive elbows down toward hips','Chin over bar at top'],
    goal: 'Strength',
    repRange: '5-10 reps',
    intensity: 'High',
    ptNote: 'The ultimate back builder. Start with assisted pull-ups or resistance band rows if you cannot do 5 clean reps. Quality > quantity.',
  },
  'Overhead Press': {
    formTips: ['Grip just outside shoulders','Bar path: close to face going up, slight arc around chin','Tight core, glutes squeezed','Head through at lockout'],
    goal: 'Strength',
    repRange: '6-10 reps',
    intensity: 'High',
    ptNote: 'Best raw shoulder strength builder. Do not let your lower back arch excessively — brace your core like you are about to take a punch.',
  },
  'Hip Thrust': {
    formTips: ['Shoulders on bench, feet planted','Drive through heels, squeeze glutes at top','Chin tucked, eyes forward','Hold 2s at peak contraction'],
    goal: 'Hypertrophy',
    repRange: '8-12 reps',
    intensity: 'Moderate',
    ptNote: 'Glute isolation perfection. If you feel hamstrings more than glutes, move feet closer. Squeeze HARD at the top for 2 seconds.',
  },
  'Leg Press': {
    formTips: ['Feet high and wide on platform','Do not let lower back round off pad','Controlled eccentric','Full range without knee cave'],
    goal: 'Hypertrophy',
    repRange: '8-15 reps',
    intensity: 'Moderate',
    ptNote: 'Safer quad builder than squats for beginners. Go deep but stop before your lower back rounds. Never lock out explosively.',
  },
  'Incline Dumbbell Press': {
    formTips: ['Bench at 30-45°','Palms facing inward at bottom','Controlled stretch at bottom','Do not clank dumbbells together'],
    goal: 'Hypertrophy',
    repRange: '8-12 reps',
    intensity: 'Moderate',
    ptNote: 'Hits the upper chest (clavicular head) that flat bench misses. Lower slowly — 3 seconds down is where the growth happens.',
  },
  'Barbell Row': {
    formTips: ['Hinge position, back ~parallel to floor','Pull to lower chest/upper abs','Control the bar on the way down','Do not use momentum'],
    goal: 'Strength',
    repRange: '6-10 reps',
    intensity: 'High',
    ptNote: 'Brutal but effective back thickness builder. If your form breaks, switch to chest-supported rows. Ego lifting here causes lower back issues.',
  },
  'Lateral Raise': {
    formTips: ['Slight bend in elbows','Lead with elbows, not hands','Stop at shoulder height','Control the negative (3-4s down)'],
    goal: 'Hypertrophy',
    repRange: '12-20 reps',
    intensity: 'Moderate',
    ptNote: 'Lateral deltoid sculpting. The magic is in the slow lowering phase. Go lighter than you think — strict form beats heavy swinging.',
  },
  'Bicep Curl': {
    formTips: ['Elbows locked at sides','Supinate wrists as you curl','Full extension at bottom','Squeeze at the top'],
    goal: 'Hypertrophy',
    repRange: '10-15 reps',
    intensity: 'Moderate',
    ptNote: 'Classic arm builder. The bicep has two heads — rotate your pinky outward at the top for maximum peak contraction.',
  },
  'Tricep Pushdown': {
    formTips: ['Elbows pinned to sides','Full extension at bottom, squeeze tricep','Do not let elbows drift forward','Control the return'],
    goal: 'Hypertrophy',
    repRange: '10-15 reps',
    intensity: 'Moderate',
    ptNote: 'Triceps are 2/3 of your arm. Lock out fully and hold for 1 second — that is where the lateral head gets hit hardest.',
  },
  'Leg Curl': {
    formTips: ['Align knee joint with machine axis','Control the negative','Squeeze hamstrings at peak','Do not swing or use momentum'],
    goal: 'Hypertrophy',
    repRange: '10-12 reps',
    intensity: 'Moderate',
    ptNote: 'Isolates hamstrings for balanced leg development. Slow eccentrics (4 seconds down) are the key to hamstring growth.',
  },
  'Calf Raise': {
    formTips: ['Full stretch at bottom','Drive through big toe at top','Pause 2 seconds at peak','Do not bounce'],
    goal: 'Hypertrophy',
    repRange: '12-20 reps',
    intensity: 'Moderate',
    ptNote: 'Calves need high reps and deep stretch. Most people train them wrong — go slow, get a full stretch, and pause at the top.',
  },
  'Plank': {
    formTips: ['Elbows under shoulders','Body in straight line (no hip sag or pike)','Glutes and quads engaged','Breathe normally'],
    goal: 'Endurance',
    repRange: '30-60s hold',
    intensity: 'Low',
    ptNote: 'Anti-extension core stability. If your hips sag, stop. Quality plank for 30s beats sloppy plank for 2 minutes.',
  },
  'Low Cable Lateral Raise': {
    formTips: ['Stand slightly back from machine','Lead with elbows','Stop at shoulder height','Slow negative'],
    goal: 'Hypertrophy',
    repRange: '12-15 reps',
    intensity: 'Moderate',
    ptNote: 'Cable tension stays constant throughout — superior to dumbbells for delt development. Keep the cable path perpendicular to your arm.',
  },
  'Overhead Cable Tricep Extension': {
    formTips: ['Elbows tight to head','Hinge only at elbow','Full extension at bottom','Do not flare elbows'],
    goal: 'Hypertrophy',
    repRange: '12-15 reps',
    intensity: 'Moderate',
    ptNote: 'Hits the long head of triceps (the biggest head). Keep elbows pointing forward — if they flare out, the long head disengages.',
  },
  'Ab Wheel Rollout': {
    formTips: ['Start on knees, hands on wheel','Brace core, maintain hollow body','Roll out until body is nearly parallel','Pull back using core, not hips'],
    goal: 'Strength',
    repRange: '8-12 reps',
    intensity: 'High',
    ptNote: 'Advanced anti-extension core move. If your back arches during rollout, you have gone too far. Start with planks first.',
  },
  'Dead Bug': {
    formTips: ['Lower back pressed to floor','Opposite arm and leg extend slowly','Do not let ribs flare','Breathe out on extension'],
    goal: 'Endurance',
    repRange: '8-10 per side',
    intensity: 'Low',
    ptNote: 'Perfect for spinal stability and pelvic control. The key is keeping your lower back flat — if it arches, you are cheating.',
  },
  'Chest-Supported DB Row': {
    formTips: ['Chest flat on incline bench','Row dumbbells toward hips','Squeeze shoulder blades at top','Control on the way down'],
    goal: 'Hypertrophy',
    repRange: '10-12 reps',
    intensity: 'Moderate',
    ptNote: 'Eliminates lower back strain. Row toward your hips, not your armpits — this hits the lats better than mid-back.',
  },
  'Seated Cable Row': {
    formTips: ['Neutral grip, close attachment','Sit tall, slight lean forward','Pull to lower chest, squeeze shoulder blades','Control the return'],
    goal: 'Hypertrophy',
    repRange: '10-12 reps',
    intensity: 'Moderate',
    ptNote: 'Consistent cable tension makes this a back thickness staple. Lean slightly forward at the start to get a full stretch.',
  },
  'Incline DB Curl': {
    formTips: ['Bench at 45-60°','Arms hang straight down','Supinate wrists at top','Squeeze biceps at peak'],
    goal: 'Hypertrophy',
    repRange: '10-12 reps',
    intensity: 'Moderate',
    ptNote: 'The incline stretches the long head of the bicep (outer peak). This is the curl that builds that tall bicep peak.',
  },
  'Face Pull': {
    formTips: ['Rope attachment, elbows high','Pull toward face, externally rotate','Squeeze rear delts at peak','Control on return'],
    goal: 'Endurance',
    repRange: '15-20 reps',
    intensity: 'Low',
    ptNote: 'Rear delt and rotator cuff health. Every lifter should face pull. Aim for 2 seconds at peak contraction, thumbs pointing behind you.',
  },
  'Dead Hang': {
    formTips: ['Full grip, arms straight','Shoulders relaxed (not shrugged)','Breathe naturally','Gradually increase duration'],
    goal: 'Mobility',
    repRange: '30-60s hold',
    intensity: 'Low',
    ptNote: 'Decompresses the spine and builds grip endurance. Let your shoulders relax — do not actively shrug. Great for shoulder health.',
  },
  'Romanian Deadlift': {
    formTips: ['Soft knee bend, never locked','Hinge until you feel hamstring stretch','Bar stays close to body','Drive hips forward to stand'],
    goal: 'Hypertrophy',
    repRange: '6-10 reps',
    intensity: 'High',
    ptNote: 'Pure hamstring and glute developer. The bar should slide down your thighs — if it drifts forward, your hamstrings are not engaged.',
  },
  'Tibialis Raise': {
    formTips: ['Heels on floor, toes elevated','Pull toes up toward shins','Pause 2 seconds at top','Slow controlled motion'],
    goal: 'Endurance',
    repRange: '15-20 reps',
    intensity: 'Low',
    ptNote: 'Essential for knee health and shin splint prevention. The tibialis anterior is the brake pedal of your legs — strengthen it.',
  },
  'Goblet Squat': {
    formTips: ['Dumbbell at chest, elbows tucked','Feet slightly wider than shoulders','Drop between your legs','Keep chest up throughout'],
    goal: 'Hypertrophy',
    repRange: '12-15 reps',
    intensity: 'Moderate',
    ptNote: 'Best squat for beginners. The weight at the front forces upright posture naturally. Perfect for conditioning day metabolic work.',
  },
  'Reverse Lunge': {
    formTips: ['Step back, drop knee toward floor','Front shin stays vertical','Drive through front heel to stand','Keep torso upright'],
    goal: 'Hypertrophy',
    repRange: '10-12 per leg',
    intensity: 'Moderate',
    ptNote: 'Easier on knees than forward lunges. The reverse step forces glute engagement. Keep your front knee behind your toes.',
  },
  'Glute Bridge': {
    formTips: ['Shoulders on floor, feet planted','Drive hips up, squeeze glutes hard','Body in straight line at top','Do not hyperextend lower back'],
    goal: 'Hypertrophy',
    repRange: '15-20 reps',
    intensity: 'Low',
    ptNote: 'Great glute activator and beginner-friendly. If you feel it in your lower back, tuck your pelvis (posterior tilt) before lifting.',
  },
  'Push-Up': {
    formTips: ['Body straight as a plank','Hands under shoulders or slightly wider','Lower until chest nearly touches','Explode up, full lockout'],
    goal: 'Strength',
    repRange: '10-20 reps',
    intensity: 'Moderate',
    ptNote: 'The ultimate bodyweight chest builder. If regular push-ups are easy, elevate feet or try explosive clap push-ups.',
  },
  'Resistance Band Row': {
    formTips: ['Anchor band at chest height','Sit or stand with neutral spine','Pull elbows back, squeeze shoulder blades','Control the release'],
    goal: 'Endurance',
    repRange: '15-20 reps',
    intensity: 'Low',
    ptNote: 'Perfect for conditioning day or travel workouts. The band gives max tension at peak contraction — great for muscle activation.',
  },
  'Pallof Press': {
    formTips: ['Stand perpendicular to cable','Band/cable at chest height','Press arms straight out, resist rotation','Hold 2-3s, return slowly'],
    goal: 'Endurance',
    repRange: '10-12 per side',
    intensity: 'Low',
    ptNote: 'Anti-rotation core stability. Your goal is zero body rotation. The closer your feet, the harder it gets. Start with a wide stance.',
  },
  'Lat Pulldown': {
    formTips: ['Thigh pad snug, feet flat','Lean back slightly','Pull to upper chest, squeeze lats','Control the weight up, full stretch'],
    goal: 'Strength',
    repRange: '6-12 reps',
    intensity: 'Moderate',
    ptNote: 'The go-to pull-up alternative. If you cannot do 8+ pull-ups yet, use this instead. Focus on driving your elbows down, not pulling with your hands.',
  },
  'Walking Lunge': {
    formTips: ['Step forward, drop back knee toward floor','Front knee stays over ankle','Torso upright, core tight','Drive through front heel to stand'],
    goal: 'Hypertrophy',
    repRange: '10-12 per leg',
    intensity: 'Moderate',
    ptNote: 'Unilateral leg builder that also trains balance and coordination. Keep your torso vertical — leaning forward shifts stress away from the quads.',
  },
  'Leg Extension': {
    formTips: ['Align knee with machine axis','Extend fully, squeeze quads 1s at top','Control the negative','Do not swing or use momentum'],
    goal: 'Hypertrophy',
    repRange: '10-15 reps',
    intensity: 'Moderate',
    ptNote: 'Pure quad isolation. Not a strength move — this is for hypertrophy and knee health. Squeeze hard at the top and lower slowly for 3 seconds.',
  },
  'Cable Fly': {
    formTips: ['Slight forward lean','Arms slightly bent throughout','Squeeze chest at peak contraction','Control the return, feel the stretch'],
    goal: 'Hypertrophy',
    repRange: '10-15 reps',
    intensity: 'Moderate',
    ptNote: 'Superior chest isolation compared to dumbbell flyes — constant tension from the cable. Do not go too heavy — this is a feel movement, not an ego lift.',
  },
  'Dip': {
    formTips: ['Torso slightly forward to hit chest','Elbows tuck ~45°','Lower until upper arms parallel','Drive up explosively'],
    goal: 'Strength',
    repRange: '8-12 reps',
    intensity: 'High',
    ptNote: 'The bodyweight bench press. Lean forward for chest emphasis, stay upright for triceps. Add weight with a dip belt once you can do 15+ clean reps.',
  },
  'Front Squat': {
    formTips: ['Bar rests on front delts, fingertips under','Elbows high, parallel to floor','Torso stays more upright than back squat','Depth: hips below parallel'],
    goal: 'Strength',
    repRange: '5-8 reps',
    intensity: 'High',
    ptNote: 'Quad-dominant squat variation. The upright torso puts less stress on the lower back. If wrist mobility is limited, use a cross-arm grip or straps.',
  },
  'Barbell Curl': {
    formTips: ['Grip at shoulder width','Elbows pinned to sides','No swinging or momentum','Squeeze biceps at the top'],
    goal: 'Strength',
    repRange: '8-10 reps',
    intensity: 'Moderate',
    ptNote: 'Heavier curl variation that builds overall bicep mass. Keep your elbows LOCKED at your sides — any swinging means the weight is too heavy.',
  },
  'Hammer Curl': {
    formTips: ['Neutral grip (palms facing each other)','Elbows pinned to sides','Curl toward opposite shoulder','Control the lowering phase'],
    goal: 'Hypertrophy',
    repRange: '10-12 reps',
    intensity: 'Moderate',
    ptNote: 'Targets the brachialis and brachioradialis — the muscles that make your arms look thick from the side. Essential for complete arm development.',
  },
  'Rack Pull': {
    formTips: ['Bar at knee height in rack','Grip just outside legs','Hinge hips, lockout at top','Lower with control to pins'],
    goal: 'Strength',
    repRange: '5-8 reps',
    intensity: 'High',
    ptNote: 'Deadlift variation from knee height. Overloads the lockout portion and builds massive grip and upper back strength. Great for beginners not ready for full deadlifts.',
  },
  'JM Press': {
    formTips: ['Lie on flat bench, bar at chest','Elbows tucked tight to body','Lower bar toward chin/neck','Press back up, triceps drive'],
    goal: 'Strength',
    repRange: '8-12 reps',
    intensity: 'High',
    ptNote: 'The love child of a close-grip bench and skullcrusher. Named after JM Blakely. Go lighter than your close-grip bench — the elbow position is awkward at first.',
  },
  'EZ Bar Curl': {
    formTips: ['Curved bar, medium grip','Elbows pinned to sides','Squeeze at the top, control the negative','Do not swing'],
    goal: 'Strength',
    repRange: '8-12 reps',
    intensity: 'Moderate',
    ptNote: 'The angled grip is easier on your wrists than a straight bar. This lets you go heavier with less joint stress — great for building bicep thickness.',
  },
  'Sumo Squat': {
    formTips: ['Wide stance, toes pointing outward','Hold dumbbell at chest or goblet style','Drop hips straight down','Drive through heels to stand'],
    goal: 'Hypertrophy',
    repRange: '12-20 reps',
    intensity: 'Moderate',
    ptNote: 'Hits inner thighs (adductors) more than standard squats. Also reduces lower back stress due to the upright torso. Perfect for home workouts.',
  },
  'Mountain Climber': {
    formTips: ['Plank position, hands under shoulders','Drive one knee to chest, then switch rapidly','Keep hips level (do not pike or sag)','Breathe steadily'],
    goal: 'Endurance',
    repRange: '20-30 reps',
    intensity: 'High',
    ptNote: 'Cardio meets core. Your hips will want to hike up — fight it. The faster you go, the more metabolic demand. Great for HIIT circuits.',
  },
  'Burpee': {
    formTips: ['Drop to plank, chest to floor','Explosive jump up from bottom','Land softly, absorb with legs','Keep core tight throughout'],
    goal: 'Endurance',
    repRange: '8-12 reps',
    intensity: 'High',
    ptNote: 'The ultimate conditioning movement. If burpees feel impossible, start with step-back burpees (no jump). Add the jump and push-up as you get fitter.',
  },
  'Leg Raise': {
    formTips: ['Hang from bar or lie on floor','Lift legs straight up to 90°','Control the lowering — do not swing','Tuck pelvis slightly to engage lower abs'],
    goal: 'Endurance',
    repRange: '10-15 reps',
    intensity: 'Moderate',
    ptNote: 'Hanging leg raises are advanced — start with lying leg raises if you cannot do 10 clean reps. The key is controlling the eccentric (lowering) phase.',
  },
  'Step-Up': {
    formTips: ['One foot on box, other on floor','Drive through front heel to stand fully','Control the lowering — do not drop','Keep torso upright'],
    goal: 'Hypertrophy',
    repRange: '10-12 per leg',
    intensity: 'Moderate',
    ptNote: 'Unilateral leg builder that also trains balance. Do not push off the back foot — all the work comes from the front leg. Box height = mid-thigh.',
  },
  'Hack Squat': {
    formTips: ['Back flat against pad, shoulders tucked','Feet shoulder-width on platform','Lower until thighs parallel to platform','Drive through heels, do not lock out hard'],
    goal: 'Hypertrophy',
    repRange: '8-12 reps',
    intensity: 'High',
    ptNote: 'Machine squat that removes the balance challenge of free-weight squats. You can go heavy with less spinal loading. Great for quad-dominant leg days.',
  },
  "Farmer's Carry": {
    formTips: ['Heavy dumbbells in each hand','Stand tall, shoulders back, core braced','Walk with short, controlled steps','Do not let weights swing'],
    goal: 'Strength',
    repRange: '30-60s carry',
    intensity: 'Moderate',
    ptNote: 'Grip + core + posture in one move. Your grip will fail before your legs. Use the heaviest dumbbells you can hold for the full distance. Walk like you own the gym.',
  },
  'Band Pull-Apart': {
    formTips: ['Hold band at shoulder width','Arms straight, pull band apart','Squeeze shoulder blades at peak','Control the return, feel rear delts'],
    goal: 'Endurance',
    repRange: '15-20 reps',
    intensity: 'Low',
    ptNote: 'The best prehab exercise for shoulder health. Do these every single push day before your first set. Light band, controlled reps, squeeze your shoulder blades together.',
  },
  'Bicycle Crunch': {
    formTips: ['Lower back pressed to floor','Opposite elbow to opposite knee','Slow, controlled rotation','Do not pull on your neck'],
    goal: 'Endurance',
    repRange: '15-20 reps',
    intensity: 'Low',
    ptNote: 'Hits the obliques through rotation. The key is the slow twisting motion — do not rush. Keep your lower back glued to the floor throughout.',
  },
  'Jump Squat': {
    formTips: ['Squat to parallel or below','Explode upward into a jump','Land softly, absorb with legs','Immediately go into next rep'],
    goal: 'Endurance',
    repRange: '8-12 reps',
    intensity: 'High',
    ptNote: 'Plyometric leg builder. Adds explosive power to your squat. Land softly — think "feather landing." If your knees hurt, stick to regular squats.',
  },
  'Reverse Curl': {
    formTips: ['Palms facing down (pronated grip)','Elbows pinned to sides','Curl up, control the lowering','Feel the forearm burn'],
    goal: 'Hypertrophy',
    repRange: '8-12 reps',
    intensity: 'Moderate',
    ptNote: 'Targets the brachioradialis and forearms — the key to thick-looking arms from every angle. Go lighter than regular curls; these are humbling.',
  },
  // ─── HYROX-specific exercises ───
  'SkiErg': {
    formTips: ['Hinge at hips, not knees','Arms pull through the hips','Keep rhythm consistent — don\'t sprint and die','Drive with legs, follow with arms'],
    goal: 'Endurance',
    repRange: '500-1000m',
    intensity: 'High',
    ptNote: 'HYROX station #1. Most people blow up here by going too hard. A 4:30/500m pace is smarter than 3:50 and dying on the sled. Legs drive, arms follow — don\'t arm-pull.',
  },
  'Rowing Machine': {
    formTips: ['Legs drive first, then lean back, then arms','Return: arms, lean, legs — never reverse','Keep stroke rate controlled (22-26spm)','Drive through heels'],
    goal: 'Endurance',
    repRange: '500-1000m',
    intensity: 'High',
    ptNote: 'HYROX station #5. The most technical movement — get the sequence right or you waste energy. Legs-body-arms on the drive, arms-body-legs on recovery. Practice this until it\'s automatic.',
  },
  'Sled Push': {
    formTips: ['Low hips, arms straight','Drive through heels','Lean into sled at ~45°','Short, powerful strides'],
    goal: 'Strength',
    repRange: '25-50m',
    intensity: 'High',
    ptNote: 'HYROX station #2 (men: +102kg, women: +72kg). This is where races are won or lost. Stay low, drive through the floor. If you stand up, you lose leverage. Train at working weight — no half measures.',
  },
  'Sled Pull': {
    formTips: ['Walk backward with tension','Don\'t let the rope go slack','Brace core throughout','Short, powerful steps'],
    goal: 'Strength',
    repRange: '25-50m',
    intensity: 'High',
    ptNote: 'HYROX station #3 (men: +78kg, women: +56kg). Backward walking under load — awkward but trainable. Keep the rope taut at all times. A slack rope means a dead stop, and restarting is brutal.',
  },
  'Burpee Broad Jump': {
    formTips: ['Land soft, load hips','Explode forward on the jump','Don\'t collapse at the chest','Find a rhythm and stick to it'],
    goal: 'Endurance',
    repRange: '80m',
    intensity: 'High',
    ptNote: 'HYROX station #4. The most feared station. 80 meters of pure suffering. Your goal is efficiency, not speed — find a steady rhythm and never break it. Breathe on every rep.',
  },
  'Sandbag Lunge': {
    formTips: ['Bag on shoulder or front-racked','Rear knee hovers just off floor','Step through, don\'t drag','Keep torso upright'],
    goal: 'Strength',
    repRange: '30-100m',
    intensity: 'High',
    ptNote: 'HYROX station #7 (men: 20kg, women: 10kg). Unilateral leg destroyer. The bag on your shoulder shifts your center of mass — brace your core hard. Switch shoulders at the turnaround.',
  },
  'Wall Ball': {
    formTips: ['Full depth squat on every rep','Catch momentum on the way up','Drive hips to explode the throw','Don\'t arm-throw — it gasses you fast'],
    goal: 'Endurance',
    repRange: '100 reps',
    intensity: 'High',
    ptNote: 'HYROX station #8 (men: 6kg to 4m, women: 4kg to 3m). The final station when you\'re already empty. Break early: 25-25-25-25. Don\'t go unbroken and gas out — pacing wins here.',
  },
  'Single-Leg RDL': {
    formTips: ['Standing leg slightly bent','Hinge at hips, keep back flat','Reach dumbbells toward floor','Feel the hamstring stretch'],
    goal: 'Hypertrophy',
    repRange: '8-12 reps',
    intensity: 'Moderate',
    ptNote: 'Unilateral posterior chain builder. Essential for HYROX stability and balance. If you wobble, go lighter — the goal is controlled range of motion, not weight. Great for fixing imbalances.',
  },
  'Bulgarian Split Squat': {
    formTips: ['Rear foot elevated on bench','Front knee tracks over toes','Lower until rear knee nearly touches floor','Drive up through front heel'],
    goal: 'Hypertrophy',
    repRange: '8-12 reps',
    intensity: 'High',
    ptNote: 'The single best unilateral leg exercise. Brutal but effective. Builds the quad and glute strength needed for HYROX stations. If regular split squats are easy, add dumbbells.',
  },
  'Kettlebell Swing': {
    formTips: ['Hinge at hips, not a squat','Drive hips forward explosively','KB reaches chest/shoulder height','Let gravity do the lowering'],
    goal: 'Endurance',
    repRange: '15-20 reps',
    intensity: 'High',
    ptNote: 'Posterior chain power endurance. Perfect for HYROX training — bridges the gap between strength and cardio. It\'s a hinge, not a squat. If your quads burn, you\'re squatting too much.',
  },
  'Stationary Bike': {
    formTips: ['Set seat so leg is almost straight at bottom of pedal stroke','Keep core engaged, don\'t slump','Vary cadence: 60rpm strength, 90rpm endurance','Use both seated and standing positions'],
    goal: 'Endurance',
    repRange: '10-30 min',
    intensity: 'Moderate',
    ptNote: 'Low-impact cardio that\'s easy on the joints. Great for recovery days or building aerobic base. Mix in intervals: 30s hard / 30s easy for HIIT-style sessions. Keep resistance moderate — spinning fast with no resistance is wasted time.',
  },
  'Treadmill Run': {
    formTips: ['Start at walking pace to warm up','Land mid-foot, not heel','Keep stride short and cadence high (170+ spm)','Use 1% incline to mimic outdoor running'],
    goal: 'Endurance',
    repRange: '10-45 min',
    intensity: 'High',
    ptNote: 'The gold standard for cardio fitness. Start with walk-run intervals if new to running. The 1% incline rule is real — it accounts for the belt helping you. Don\'t hold the handrails — it changes your gait and reduces calorie burn.',
  },
  'Treadmill Walk': {
    formTips: ['Set incline to 5-12% for calorie burn','Keep posture upright','Swing arms naturally','Walk at 5.5-6.5km/h pace'],
    goal: 'Endurance',
    repRange: '20-60 min',
    intensity: 'Low',
    ptNote: 'The most underrated cardio exercise. A 12% incline walk at 5.5km/h burns nearly as many calories as running flat — with way less joint stress. Perfect for recovery days, beginners, or anyone carrying extra weight.',
  },
  'Elliptical': {
    formTips: ['Stand tall, don\'t lean on handles','Push and pull handles for full-body engagement','Vary resistance and stride direction','Keep heels on pedals'],
    goal: 'Endurance',
    repRange: '15-30 min',
    intensity: 'Moderate',
    ptNote: 'Zero-impact cardio that still works legs and arms. Great for injured runners or as a recovery day option. Go forward for quads, reverse for hamstrings and glutes. Don\'t lean on the handles — it defeats the purpose.',
  },
  'Stair Climber': {
    formTips: ['Stand upright, don\'t hunch over','Push through the full foot','Don\'t hold the side rails','Keep steps consistent and controlled'],
    goal: 'Endurance',
    repRange: '10-20 min',
    intensity: 'High',
    ptNote: 'The most brutal cardio machine in any gym. 10 minutes on a stair climber feels like 30 on a bike. Incredible for glutes and calves. If you find yourself holding the rails, lower the speed — proper form matters more than the number.',
  },
  'Assault Bike': {
    formTips: ['Push and pull with arms AND legs','Breathe rhythmically — it gets hard fast','Start with 10s sprint / 50s rest intervals','Maintain consistent RPMs during endurance work'],
    goal: 'Endurance',
    repRange: '5-15 min',
    intensity: 'Very High',
    ptNote: 'The devil\'s tricycle. This machine fights back — the harder you push, the harder it pushes. Arms and legs work together, making it a true full-body cardio destroyer. Short intervals are best: 20s max effort / 40s rest x 8 rounds.',
  },
  'Box Jump': {
    formTips: ['Start with box at mid-shin height','Land softly with both feet fully on box','Stand tall at top, lock out hips','Step down, don\'t jump down'],
    goal: 'Power',
    repRange: '5-10 reps',
    intensity: 'High',
    ptNote: 'Develops explosive leg power. Land softly — if you\'re clattering down, the box is too high. Step down between reps to save your joints. Start low and progress gradually. Not a conditioning exercise — keep reps low and quality high.',
  },
  'Jumping Jack': {
    formTips: ['Jump feet out while raising arms overhead','Land softly on balls of feet','Keep core tight throughout','Find a rhythm and maintain it'],
    goal: 'Endurance',
    repRange: '30-60 reps',
    intensity: 'Low',
    ptNote: 'The classic warmup exercise that doubles as low-intensity cardio. Great for raising body temperature before lifting. If 60 reps feels easy, do them faster or add a light resistance band around the wrists.',
  },
  'High Knees': {
    formTips: ['Drive knees up to waist height','Stay on balls of feet','Pump arms in running motion','Keep torso upright — don\'t lean back'],
    goal: 'Endurance',
    repRange: '20-40 reps',
    intensity: 'High',
    ptNote: 'Running in place with exaggerated knee drive. Excellent for hip flexor activation and cardio conditioning. The higher the knees, the harder it is. Do these before squats to wake up your hip flexors — your depth will improve.',
  },
  'Battle Ropes': {
    formTips: ['Brace core hard — the ropes will try to pull you forward','Keep shoulders down and back','Generate power from hips, not just arms','Make waves big and consistent'],
    goal: 'Endurance',
    repRange: '20-40 sec',
    intensity: 'Very High',
    ptNote: 'An upper-body cardio exercise that also crushes your core. Most people think it\'s an arm workout — it\'s actually a full-body movement powered by the hips. Do intervals: 20s on / 40s off. If your waves are getting small, rest longer.',
  },
  'Sprint Intervals': {
    formTips: ['Warm up thoroughly first — 5-10 min easy jog','Sprint at 90-100% effort for the work period','Walk or stand still during rest — no jogging','Keep total volume low: 6-10 sprints max per session'],
    goal: 'Power',
    repRange: '6-10 sprints',
    intensity: 'Very High',
    ptNote: 'The most time-efficient cardio you can do. 20 minutes of sprint intervals burns more fat and preserves more muscle than an hour of steady-state. Track or treadmill both work. Start with 15s sprint / 45s rest x 6 and build from there.',
  },
  'Boxing Heavy Bag': {
    formTips: ['Keep hands up, chin tucked','Rotate hips into every punch','Breathe out sharply on every strike','Move your feet between combinations'],
    goal: 'Endurance',
    repRange: '3 min rounds',
    intensity: 'High',
    ptNote: 'One of the best stress-relief and cardio exercises. 3-minute rounds with 1-minute rest mimics actual boxing rounds. Focus on combinations, not single power shots. Your shoulders will burn — that\'s the point. Wrap your hands or you\'ll mess up your wrists.',
  },
  'Jump Rope': {
    formTips: ['Stay on balls of feet, knees slightly bent','Keep elbows close to body','Use wrists to turn rope, not arms','Jump just high enough to clear the rope'],
    goal: 'Endurance',
    repRange: '1-5 min',
    intensity: 'High',
    ptNote: 'Underrated cardio that also trains coordination and calf endurance. Start with 30s on / 30s off and build up. Double-unders are the goal — the rope passes under your feet twice per jump. Land softly or your shins will hate you.',
  },
};

function getYouTubeSearchUrl(exerciseName: string): string {
  const query = encodeURIComponent(`${exerciseName} proper form tutorial`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

export function ExerciseLibrary({ exercises, onAddExercise, onDeleteExercise }: ExerciseLibraryProps) {
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('All');
  const [equipmentFilter, setEquipmentFilter] = useState('All');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: '', muscleGroup: 'Chest', equipment: 'Barbell' });
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const filtered = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = muscleFilter === 'All' || ex.muscleGroup === muscleFilter;
    const matchesEquipment = equipmentFilter === 'All' || ex.equipment === equipmentFilter;
    return matchesSearch && matchesMuscle && matchesEquipment;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pb-24 pt-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Exercise Library</h1>
          <p className="text-sm text-zinc-500">Tap any exercise to see PT form guidance</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="rounded-full bg-emerald-500 text-white hover:bg-emerald-400">
          <Plus className="mr-2 h-4 w-4" />
          New Exercise
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={muscleFilter}
            onChange={(e) => setMuscleFilter(e.target.value)}
            className="h-11 rounded-xl border border-white/[0.08] bg-white/5 px-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
          >
            {MUSCLE_GROUPS.map((g) => (
              <option key={g} value={g} className="bg-zinc-900">{g}</option>
            ))}
          </select>
          <select
            value={equipmentFilter}
            onChange={(e) => setEquipmentFilter(e.target.value)}
            className="h-11 rounded-xl border border-white/[0.08] bg-white/5 px-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
          >
            {EQUIPMENT_TYPES.map((e) => (
              <option key={e} value={e} className="bg-zinc-900">{e}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-sm text-zinc-500">{filtered.length} exercises found</p>

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((ex, i) => {
          const guidance = EXERCISE_GUIDANCE[ex.name];
          const isExpanded = expandedCard === ex.id;
          return (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="group relative overflow-hidden rounded-xl border border-white/[0.08] transition-all duration-200 hover:border-white/[0.15] hover:-translate-y-1"
              style={{ background: 'rgba(18, 18, 26, 0.6)', backdropFilter: 'blur(12px)' }}
            >
              {/* Image */}
              {ex.image ? (
                <div className="relative aspect-video overflow-hidden cursor-pointer" onClick={() => setExpandedCard(isExpanded ? null : ex.id)}>
                  <img src={ex.image} alt={ex.name} className="h-full w-full object-cover saturate-[0.8] contrast-110 transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12121A] via-transparent to-transparent" />
                  {guidance && (
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        guidance.goal === 'Strength' ? 'bg-red-500/30 text-red-400' :
                        guidance.goal === 'Hypertrophy' ? 'bg-emerald-500/30 text-emerald-400' :
                        guidance.goal === 'Endurance' ? 'bg-cyan-500/30 text-cyan-400' :
                        'bg-yellow-500/30 text-yellow-400'
                      }`}>
                        {guidance.goal}
                      </span>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        guidance.intensity === 'High' ? 'bg-orange-500/30 text-orange-400' :
                        guidance.intensity === 'Moderate' ? 'bg-yellow-500/30 text-yellow-400' :
                        'bg-zinc-500/30 text-zinc-400'
                      }`}>
                        {guidance.intensity}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center bg-zinc-800/50 cursor-pointer" onClick={() => setExpandedCard(isExpanded ? null : ex.id)}>
                  <Dumbbell className="h-12 w-12 text-zinc-700" />
                </div>
              )}

              {/* Card Body */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{ex.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">{ex.muscleGroup}</span>
                      <span className="rounded-md bg-cyan-500/20 px-2 py-0.5 text-xs font-medium text-cyan-400">{ex.equipment}</span>
                    </div>
                  </div>
                  {ex.isCustom && (
                    <button onClick={() => onDeleteExercise(ex.id)} className="rounded-lg p-1 text-zinc-600 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Quick meta */}
                {guidance && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                    <Info className="h-3 w-3 text-emerald-500" />
                    <span>{guidance.repRange}</span>
                    <span className="text-zinc-700">|</span>
                    <span className="text-zinc-400">Tap for form tips</span>
                  </div>
                )}

                {/* Expanded PT Guidance */}
                <AnimatePresence>
                  {isExpanded && guidance && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-3 border-t border-white/[0.06] pt-3">
                        {/* PT Note */}
                        <div className="rounded-lg bg-emerald-500/10 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">PT Note</p>
                          <p className="mt-1 text-sm leading-relaxed text-zinc-300">{guidance.ptNote}</p>
                        </div>

                        {/* Form Tips */}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Form Checklist</p>
                          <ul className="mt-1.5 space-y-1">
                            {guidance.formTips.map((tip, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-zinc-400">
                                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Goal Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-zinc-500">Best for:</span>
                          <span className={`rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                            guidance.goal === 'Strength' ? 'bg-red-500/20 text-red-400' :
                            guidance.goal === 'Hypertrophy' ? 'bg-emerald-500/20 text-emerald-400' :
                            guidance.goal === 'Endurance' ? 'bg-cyan-500/20 text-cyan-400' :
                            guidance.goal === 'Mobility' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-orange-500/20 text-orange-400'
                          }`}>{guidance.goal}</span>
                          <span className="text-xs text-zinc-500">@ {guidance.repRange}</span>
                        </div>

                        {/* Watch Form Reference */}
                        <a
                          href={getYouTubeSearchUrl(ex.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/20 hover:border-red-400/50 hover:scale-[1.02]"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Watch on YouTube
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Expand toggle */}
                {guidance && (
                  <button
                    onClick={() => setExpandedCard(isExpanded ? null : ex.id)}
                    className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-white/5 hover:text-zinc-300"
                  >
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {isExpanded ? 'Show Less' : 'Show PT Guidance'}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add Exercise Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="border-white/[0.08] bg-[#12121A] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Add Custom Exercise</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div>
              <Label className="text-zinc-400">Exercise Name</Label>
              <Input
                value={newExercise.name}
                onChange={(e) => setNewExercise((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Cable Fly"
                className="mt-1 border-white/[0.08] bg-white/5 text-white placeholder-zinc-600 focus:border-emerald-500"
              />
            </div>
            <div>
              <Label className="text-zinc-400">Muscle Group</Label>
              <select
                value={newExercise.muscleGroup}
                onChange={(e) => setNewExercise((p) => ({ ...p, muscleGroup: e.target.value }))}
                className="mt-1 h-10 w-full rounded-md border border-white/[0.08] bg-white/5 px-3 text-white"
              >
                {MUSCLE_GROUPS.filter((g) => g !== 'All').map((g) => (
                  <option key={g} value={g} className="bg-zinc-900">{g}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-zinc-400">Equipment</Label>
              <select
                value={newExercise.equipment}
                onChange={(e) => setNewExercise((p) => ({ ...p, equipment: e.target.value }))}
                className="mt-1 h-10 w-full rounded-md border border-white/[0.08] bg-white/5 px-3 text-white"
              >
                {EQUIPMENT_TYPES.filter((e) => e !== 'All').map((e) => (
                  <option key={e} value={e} className="bg-zinc-900">{e}</option>
                ))}
              </select>
            </div>
            <Button
              onClick={() => {
                if (newExercise.name.trim()) {
                  onAddExercise(newExercise);
                  setNewExercise({ name: '', muscleGroup: 'Chest', equipment: 'Barbell' });
                  setShowAddDialog(false);
                }
              }}
              className="w-full rounded-full bg-emerald-500 text-white hover:bg-emerald-400"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Exercise
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
