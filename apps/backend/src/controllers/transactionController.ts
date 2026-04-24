import { Request, Response, NextFunction } from 'express'
import { transactionService } from '@/services/transactionService'
import { transactionMonitor } from '../services/transactionMonitor'

export const transactionController = {
  async createTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const { autoProcess, ...payload } = req.body
      const transaction = await transactionService.createTransaction(payload)
      const result = autoProcess
        ? await transactionService.processTransaction(transaction._id.toString())
        : transaction

      // Add to real-time monitor
      if (transaction.hash) {
        transactionMonitor.addTransaction(transaction.hash, transaction.status as any);
      }

      res.status(201).json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  },

  async processTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const transaction = await transactionService.processTransaction(req.params.id, req.body)

      res.json({
        success: true,
        data: transaction
      })
    } catch (error) {
      next(error)
    }
  },

  async updateTransactionStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const transaction = await transactionService.updateTransactionStatus(req.params.id, req.body)

      res.json({
        success: true,
        data: transaction
      })
    } catch (error) {
      next(error)
    }
  },

  async getTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const transaction = await transactionService.getTransaction(req.params.id)

      res.json({
        success: true,
        data: transaction
      })
    } catch (error) {
      next(error)
    }
  },

  async getTransactionStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await transactionService.getTransactionStatus(req.params.id)

      res.json({
        success: true,
        data: status
      })
    } catch (error) {
      next(error)
    }
  },

  async listTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.listTransactions({
        status: req.query.status as any,
        type: req.query.type as any,
        artwork: req.query.artwork as string | undefined,
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
        network: req.query.network as any,
        page: Number(req.query.page || 1),
        limit: Number(req.query.limit || 20)
      })

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      })
    } catch (error) {
      next(error)
    }
  }
}
