// src/dtos/WalletDTO.ts

import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';
import { OpenAPI } from 'routing-controllers-openapi';

@OpenAPI({
  description: 'Data required to create a new wallet address.',
})
export class WalletDTO {
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  // Example: Ethereum, Bitcoin, Solana
  chain: string;

  @IsString()
  @IsNotEmpty()
  // Validation for the address format itself would require custom decorators,
  // but we enforce string and non-empty here.
  address: string;

  @IsString()
  @IsOptional()
  @Length(1, 100)
  tag?: string;
}

@OpenAPI({
  description: 'Data required to update an existing wallet address.',
})
export class WalletUpdateDTO {
  @IsString()
  @IsOptional()
  @Length(1, 100)
  tag?: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  chain: string;

  @IsString()
  @IsNotEmpty()
  address: string;
}
