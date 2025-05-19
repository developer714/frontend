export interface ValidationError {
  field: string;
  message: string;
}

export const validatePassword = (password: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one uppercase letter' });
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one lowercase letter' });
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one number' });
  }
  
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one special character (!@#$%^&*)' });
  }
  
  return errors;
};

export const validateEmail = (email: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }
  
  return errors;
};

export const validateUsername = (username: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (username.length < 3) {
    errors.push({ field: 'username', message: 'Username must be at least 3 characters long' });
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push({ field: 'username', message: 'Username can only contain letters, numbers, and underscores' });
  }
  
  return errors;
};

export const validateName = (name: string, field: 'first_name' | 'last_name'): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (name.length < 2) {
    errors.push({ field, message: `${field === 'first_name' ? 'First' : 'Last'} name must be at least 2 characters long` });
  }
  
  if (!/^[a-zA-Z\s-']+$/.test(name)) {
    errors.push({ field, message: `${field === 'first_name' ? 'First' : 'Last'} name can only contain letters, spaces, hyphens, and apostrophes` });
  }
  
  return errors;
}; 