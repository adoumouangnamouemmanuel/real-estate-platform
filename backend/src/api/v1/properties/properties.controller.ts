/*
import { Request, Response } from 'express';
import { PropertyService } from './property.service';

export class PropertyController {
  static async create(req: Request, res: Response) {
    try {
      const { title, price, developerId } = req.body;

      // Delegate the heavy lifting to the service layer
      const newProperty = await PropertyService.createNewProperty({ title, price, developerId });

      // Send successful response back to the client
      return res.status(201).json({ success: true, data: newProperty });
    } catch (error: any) {
      // Catch business rule validation errors
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}
  */