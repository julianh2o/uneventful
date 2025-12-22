/**
 * Format a user's name as "First L." (first name + last initial)
 * @param firstName - The user's first name
 * @param lastName - The user's last name
 * @returns Formatted name like "John S."
 */
export const formatNameWithInitial = (firstName: string, lastName: string): string => {
	const lastInitial = lastName.charAt(0).toUpperCase();
	return `${firstName} ${lastInitial}.`;
};

/**
 * Format a user's full name as "First Last"
 * @param firstName - The user's first name
 * @param lastName - The user's last name
 * @returns Full name like "John Smith"
 */
export const formatFullName = (firstName: string, lastName: string): string => {
	return `${firstName} ${lastName}`;
};
