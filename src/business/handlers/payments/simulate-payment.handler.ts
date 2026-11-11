import { Injectable } from '@nestjs/common';
import { PaymentNotFoundError, PaymentSimulationDisabledError } from '../../domain/errors/errors.js';
import type { BankPort } from '../../ports/bank.port.js';
import type { PaymentRepository } from '../../repositories/payment.repository.js';
import AbstractRequestHandlerTemplate from '../AbstractRequestHandlerTemplate.js';
import { CommandResponse } from '../response/CommandResponse.js';
import type { ConfirmPaymentHandler, ConfirmPaymentResult } from './confirm-payment.handler.js';

export interface SimulatePaymentRequest {
  buyerId: string;
  reference: string;
  outcome: 'paid' | 'failed';
}

@Injectable()
export class SimulatePaymentHandler extends AbstractRequestHandlerTemplate<SimulatePaymentRequest, ConfirmPaymentResult> {
  constructor(
    private readonly payments: PaymentRepository,
    private readonly bank: BankPort,
    private readonly confirmPayment: ConfirmPaymentHandler,
    private readonly enabled: boolean,
  ) {
    super();
  }

  protected async handleRequest(request: SimulatePaymentRequest): Promise<CommandResponse<ConfirmPaymentResult>> {
    if (!this.enabled) throw new PaymentSimulationDisabledError();
    const payment = await this.payments.findByReference(request.reference);
    if (!payment || payment.props.buyerId !== request.buyerId) throw new PaymentNotFoundError();

    if (!payment.isPaid()) await this.bank.simulatePayment(payment.reference, request.outcome);
    return this.confirmPayment.handle({ reference: payment.reference });
  }
}
