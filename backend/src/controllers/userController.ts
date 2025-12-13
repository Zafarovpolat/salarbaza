import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth'
import * as userService from '../services/userService'

const updateProfileSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    language: z.enum(['uz', 'ru']).optional(),
})

export async function getProfile(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const user = await userService.getProfile(req.user!.id)

        res.json({
            success: true,
            data: user,
        })
    } catch (error) {
        next(error)
    }
}

export async function updateProfile(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const data = updateProfileSchema.parse(req.body)
        const user = await userService.updateProfile(req.user!.id, data)

        res.json({
            success: true,
            data: user,
        })
    } catch (error) {
        next(error)
    }
}

export async function getFavorites(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const favorites = await userService.getFavorites(req.user!.id)

        res.json({
            success: true,
            data: favorites,
        })
    } catch (error) {
        next(error)
    }
}

export async function addToFavorites(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const { productId } = req.params
        await userService.addToFavorites(req.user!.id, productId)

        res.json({
            success: true,
            message: 'Added to favorites',
        })
    } catch (error) {
        next(error)
    }
}

export async function removeFromFavorites(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const { productId } = req.params
        await userService.removeFromFavorites(req.user!.id, productId)

        res.json({
            success: true,
            message: 'Removed from favorites',
        })
    } catch (error) {
        next(error)
    }
}