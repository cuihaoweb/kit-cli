import { writable } from 'svelte/store';

function createDom() {
	const { subscribe, set, update } = writable({
		rootDom: null,
	});

	return {
		subscribe,
		set: (name, value) => {
			update(state => {
				state[name] = value;
				return state;
			});
		}
	};
}
export const dom = createDom();

function createNav() {
	const { subscribe, set, update } = writable({
		activeIndex: 0,
		list: [
		]
	});

	return {
		subscribe,
		set: (name, value) => {
			update(state => Object.assign(state, {[name]: value}))
		}
	};
}
export const nav = createNav();