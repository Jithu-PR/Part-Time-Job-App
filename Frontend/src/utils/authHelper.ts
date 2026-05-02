/**
 * Helper functions for authentication and user role checking
 */

export type UserRole = 'Restaurant Owner' | 'Authenticated' | null;

/**
 * Get the JWT token from localStorage
 */
export const getJWTToken = (): string | null => {
  return localStorage.getItem('jwt');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getJWTToken();
};

/**
 * Fetch the current logged-in user with their role and restaurant
 */
export const getCurrentUser = async () => {
  const jwt = getJWTToken();

  if (!jwt) {
    return null;
  }

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ jwt }`,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch user');
      return null;
    }

    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
};

/**
 * Get the role of the current logged-in user
 */
export const getUserRole = async (): Promise<UserRole> => {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  // Check if user has a specific role
  const userRole = user.role?.name;

  if (userRole === 'Restaurant Owner') {
    return 'Restaurant Owner';
  } else if (userRole === 'Authenticated') {
    return 'Authenticated';
  }

  return null;
};

/**
 * Check if the current user is a restaurant owner
 */
export const isRestaurantOwner = async (): Promise<boolean> => {
  const role = await getUserRole();
  return role === 'Restaurant Owner';
};

/**
 * Check if the current user is a student/authenticated user
 */
export const isStudent = async (): Promise<boolean> => {
  const role = await getUserRole();
  return role === 'Authenticated';
};

/**
 * Get restaurant for restaurant owner
 */
export const getRestaurant = async () => {
  const user = await getCurrentUser();

  if (!user || !user.restaurant) {
    return null;
  }

  return user.restaurant;
};
