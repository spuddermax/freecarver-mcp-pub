import "express";

declare global {
	namespace Express {
		export interface Response {
			success(data: any, message?: string): Response;
			error(message: string, errorCode?: number, errors?: any): Response;
			validationError(errors: any, message?: string): Response;
		}
	}
}
