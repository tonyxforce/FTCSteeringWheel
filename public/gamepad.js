var ws;
var ip = "192.168.43.1";
var status = {}

var wsReconnectTimeout = 20;
/* 
const GAMEPAD_CONNECTED = 'GAMEPAD_CONNECTED';
const GAMEPAD_DISCONNECTED = 'GAMEPAD_DISCONNECTED';
const RECEIVE_GAMEPAD_STATE = 'RECEIVE_GAMEPAD_STATE';

let gamepad1Index = -1;
let gamepad2Index = -1;

var store = {
	dispatch: (data) => {
		console.log(data);
		//ws.send(data);
	}
}

const _GamepadType = {
	LOGITECH_DUAL_ACTION: 'LOGITECH_DUAL_ACTION',
	STANDARD: 'STANDARD', // Standard as defined by W3C Gamepad spec (https://www.w3.org/TR/gamepad/#remapping)
	SONY_DUALSHOCK_4: 'SONY_DUALSHOCK_4',
	UNKNOWN: 'UNKNOWN',
};

const GamepadType = {
	..._GamepadType,

	getFromGamepad: (gamepad) => {
		if (gamepad.id.search('Logitech Dual Action') !== -1) {
			return GamepadType.LOGITECH_DUAL_ACTION;
		} else if (
			gamepad.id.search(SONY_VID) !== -1 &&
			gamepad.id.search(
				new RegExp(
					`${DUALSHOCK_GEN_1_PID}|${DUALSHOCK_GEN_2_PID}|${DUALSENSE_PID}`,
					'i',
				),
			) !== -1
		) {
			return GamepadType.SONY_DUALSHOCK_4;
		} else if (
			gamepad.id.search(
				new RegExp(`(?=.*${ETPACK_VID})(?=.*${ETPACK_PID})`, 'i'),
			) !== -1
		) {
			return GamepadType.SONY_DUALSHOCK_4;
		} else if (
			gamepad.mapping.search('standard') !== -1 ||
			gamepad.id.search('Xbox 360') !== -1 ||
			gamepad.id.toLowerCase().search('xinput') !== -1
		) {
			return GamepadType.STANDARD;
		} else {
			return GamepadType.UNKNOWN;
		}
	},

	getJoystickDeadzone: (gamepadType) => {
		switch (gamepadType) {
			case GamepadType.LOGITECH_DUAL_ACTION:
				return 0.06;
			case GamepadType.STANDARD:
				return 0.15;
			case GamepadType.SONY_DUALSHOCK_4:
				return 0.04;
			default:
				return 0.2;
		}
	},

	isSupported: (gamepadType) =>
		gamepadType !== GamepadType.UNKNOWN,
};

const SONY_VID = '054c';
const DUALSHOCK_GEN_1_PID = '09cc';
const DUALSHOCK_GEN_2_PID = '05c4';
const DUALSENSE_PID = '0ce6';

// https://github.com/OpenFTC/Extracted-RC/blob/6720cf8b4296c90b6ea4638752c2df4a52b043b9/Hardware/src/main/java/com/qualcomm/hardware/sony/SonyGamepadPS4.java#L145
const ETPACK_VID = '7545';
const ETPACK_PID = '104';

const scale = (
	value,
	oldMin,
	oldMax,
	newMin,
	newMax,
) => newMin + ((value - oldMin) * (newMax - newMin)) / (oldMax - oldMin);

// based on the corresponding function in the SDK Gamepad
const cleanMotionValues = (
	value,
	joystickDeadzone = 0.2,
	maxMotionRange = 1.0,
) => {
	// apply deadzone
	if (-joystickDeadzone < value && value < joystickDeadzone) return 0;

	// apply trim
	if (value > maxMotionRange) return maxMotionRange;
	if (value < -maxMotionRange) return maxMotionRange;

	// scale values between deadzone and trim to 0 and max range
	if (value > 0) {
		return scale(value, joystickDeadzone, maxMotionRange, 0, maxMotionRange);
	} else {
		return scale(value, -joystickDeadzone, -maxMotionRange, 0, -maxMotionRange);
	}
};

const REST_GAMEPAD_STATE = {
	left_stick_x: 0,
	left_stick_y: 0,
	right_stick_x: 0,
	right_stick_y: 0,

	dpad_up: false,
	dpad_down: false,
	dpad_left: false,
	dpad_right: false,

	a: false,
	b: false,
	x: false,
	y: false,

	guide: false,
	start: false,
	back: false,

	left_bumper: false,
	right_bumper: false,

	left_stick_button: false,
	right_stick_button: false,

	left_trigger: 0,
	right_trigger: 0,
};

const extractGamepadState = (gamepad) => {
	const type = GamepadType.getFromGamepad(gamepad);
	if (!type == GamepadType.UNKNOWN) {
		throw new Error('Unable to extract state from unsupported gamepad.');
	}

	switch (type) {
		case GamepadType.LOGITECH_DUAL_ACTION:
			return {
				left_stick_x: cleanMotionValues(-gamepad.axes[1]),
				left_stick_y: cleanMotionValues(gamepad.axes[2]),
				right_stick_x: cleanMotionValues(-gamepad.axes[3]),
				right_stick_y: cleanMotionValues(gamepad.axes[4]),

				dpad_up: gamepad.buttons[12].pressed,
				dpad_down: gamepad.buttons[13].pressed,
				dpad_left: gamepad.buttons[14].pressed,
				dpad_right: gamepad.buttons[15].pressed,

				a: gamepad.buttons[1].pressed,
				b: gamepad.buttons[2].pressed,
				x: gamepad.buttons[0].pressed,
				y: gamepad.buttons[3].pressed,

				guide: false,
				start: gamepad.buttons[9].pressed,
				back: gamepad.buttons[8].pressed,

				left_bumper: gamepad.buttons[4].pressed,
				right_bumper: gamepad.buttons[5].pressed,

				left_stick_button: gamepad.buttons[10].pressed,
				right_stick_button: gamepad.buttons[11].pressed,

				left_trigger: gamepad.buttons[6].value,
				right_trigger: gamepad.buttons[7].value,
			};
		case GamepadType.STANDARD:
			return {
				// same as SONY_DUALSHOCK_4 except guide and touchpad buttons
				// tested with generic controller reported by Chromium-based as
				// id='Xbox 360 Controller (XInput STANDARD GAMEPAD)' and mapping='standard'
				// on Firefox reports as id='xinput' and mapping='standard'
				// tested on Win11/Chrome v138, Edge v139, Firefox v135
				// USB ID=24C6, PID=543A
				left_stick_x: cleanMotionValues(gamepad.axes[0]),
				left_stick_y: cleanMotionValues(gamepad.axes[1]),
				right_stick_x: cleanMotionValues(gamepad.axes[2]),
				right_stick_y: cleanMotionValues(gamepad.axes[3]),

				dpad_up: gamepad.buttons[12].pressed,
				dpad_down: gamepad.buttons[13].pressed,
				dpad_left: gamepad.buttons[14].pressed,
				dpad_right: gamepad.buttons[15].pressed,

				a: gamepad.buttons[0].pressed,
				b: gamepad.buttons[1].pressed,
				x: gamepad.buttons[2].pressed,
				y: gamepad.buttons[3].pressed,

				guide: false,
				start: gamepad.buttons[9].pressed,
				back: gamepad.buttons[8].pressed,

				left_bumper: gamepad.buttons[4].pressed,
				right_bumper: gamepad.buttons[5].pressed,

				left_stick_button: gamepad.buttons[10].pressed,
				right_stick_button: gamepad.buttons[11].pressed,
				left_trigger: gamepad.buttons[6].value,
				right_trigger: gamepad.buttons[7].value,
			};
		case GamepadType.SONY_DUALSHOCK_4:
			{
				const state = {
					left_stick_x: cleanMotionValues(gamepad.axes[0]),
					left_stick_y: cleanMotionValues(gamepad.axes[1]),
					right_stick_x: cleanMotionValues(gamepad.axes[2]),
					right_stick_y: cleanMotionValues(gamepad.axes[3]),

					dpad_up: gamepad.buttons[12].pressed,
					dpad_down: gamepad.buttons[13].pressed,
					dpad_left: gamepad.buttons[14].pressed,
					dpad_right: gamepad.buttons[15].pressed,

					a: gamepad.buttons[0].pressed,
					b: gamepad.buttons[1].pressed,
					x: gamepad.buttons[2].pressed,
					y: gamepad.buttons[3].pressed,

					guide: gamepad.buttons[16].pressed,
					start: gamepad.buttons[9].pressed,
					back: gamepad.buttons[8].pressed,

					left_bumper: gamepad.buttons[4].pressed,
					right_bumper: gamepad.buttons[5].pressed,

					left_stick_button: gamepad.buttons[10].pressed,
					right_stick_button: gamepad.buttons[11].pressed,
					left_trigger: gamepad.buttons[6].value,
					right_trigger: gamepad.buttons[7].value,
				};
				if (gamepad.buttons[17] !== undefined) {
					state.touchpad = gamepad.buttons[17].pressed;
				}
				return state;
				break;
			}

		default:
			throw new Error(`Unable to handle support gamepad of type ${type}`);
	}
};

const gamepadMiddleware = (
	store,
) => {
	let getGamepads = navigator.getGamepads?.bind(navigator);
	if (getGamepads == null) {
		getGamepads = function () {
			return [null, null, null, null];
		};
		console.log(
			'Gamepads not supported over http. See https://developer.mozilla.org/en-US/docs/Web/API/Gamepad',
		);
		setTimeout(() => {
			store.dispatch({
				type: GAMEPAD_SUPPORTED_STATUS,
				gamepadsSupported: false,
			});
		}, 1000);
	}
	function updateGamepads() {
		const gamepads = getGamepads();
		if (gamepads.length === 0) {
			setTimeout(updateGamepads, 500);
			return;
		}

		// check for Start-A/Start-B
		for (const gamepad of getGamepads()) {
			if (gamepad === null || !gamepad.connected) {
				continue;
			}

			const gamepadType = GamepadType.getFromGamepad(gamepad);
			if (!GamepadType.isSupported(gamepadType)) {
				continue;
			}

			const gamepadState = extractGamepadState(gamepad);

			// update gamepad 1 & 2 associations
			if (gamepadState.start && gamepadState.a) {
				gamepad1Index = gamepad.index;

				store.dispatch(gamepadConnected(1));

				if (gamepad2Index === gamepad1Index) {
					store.dispatch(gamepadDisconnected(2));

					gamepad2Index = -1;
				}
			} else if (gamepadState.start && gamepadState.b) {
				gamepad2Index = gamepad.index;

				store.dispatch(gamepadConnected(2));

				if (gamepad1Index === gamepad2Index) {
					store.dispatch(gamepadDisconnected(1));

					gamepad1Index = -1;
				}
			}

			// actually dispatch motion events
			let gamepad1State;
			if (gamepad1Index !== -1) {
				const gamepad = gamepads[gamepad1Index];

				if (gamepad) {
					gamepad1State = extractGamepadState(gamepad);
				} else {
					gamepad1State = REST_GAMEPAD_STATE;
				}
			} else {
				gamepad1State = REST_GAMEPAD_STATE;
			}

			let gamepad2State;
			if (gamepad2Index !== -1) {
				const gamepad = gamepads[gamepad2Index];

				if (gamepad) {
					gamepad2State = extractGamepadState(gamepad);
				} else {
					gamepad2State = REST_GAMEPAD_STATE;
				}
			} else {
				gamepad2State = REST_GAMEPAD_STATE;
			}
		}

		requestAnimationFrame(updateGamepads);
	}

	window.addEventListener('gamepaddisconnected', (evt) => {
		// Required because lib.dom.d.ts doesn't have proper types for the gamepad events
		// Looks like it's fixed but currently not merged in the version we are using
		// See: https://github.com/microsoft/TypeScript/issues/39425 & https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/925
		const { gamepad } = evt;

		if (gamepad1Index === gamepad.index) {
			gamepad1Index = -1;
		} else if (gamepad2Index === gamepad.index) {
			gamepad2Index = -1;
		}
	});

	updateGamepads();

	return (next) => (action) => next(action);
};

gamepadMiddleware(); */