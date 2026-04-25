import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoiceQueriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ADMIN : Toutes les factures
   */
  async findAllInvoices() {
    return this.prisma.invoice.findMany({
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
            items: {
              include: {
                variant: {
                  include: {
                    product: {
                      select: {
                        id: true,
                        title: true,
                        vendorId: true,
                      },
                    },
                  },
                },
              },
            },
            address: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * VENDOR : Factures contenant au moins un de ses produits
   */
  async findInvoicesForVendor(vendorId: number) {
    // Récupérer toutes les factures où au moins un item appartient au vendeur
    const invoices = await this.prisma.invoice.findMany({
      where: {
        order: {
          items: {
            some: {
              variant: {
                product: {
                  vendorId: vendorId,
                },
              },
            },
          },
        },
      },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
            items: {
              include: {
                variant: {
                  include: {
                    product: {
                      select: {
                        id: true,
                        title: true,
                        vendorId: true,
                      },
                    },
                  },
                },
              },
            },
            address: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filtrer les items pour ne garder que ceux du vendeur
    return invoices.map((invoice) => ({
      ...invoice,
      order: {
        ...invoice.order,
        items: invoice.order.items.filter(
          (item) => item.variant.product.vendorId === vendorId
        ),
      },
    }));
  }

  /**
   * Récupérer une facture par ID
   */
  async findInvoiceById(invoiceId: number) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
            items: {
              include: {
                variant: {
                  include: {
                    product: true,
                  },
                },
              },
            },
            address: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Facture introuvable');
    }

    return invoice;
  }

  /**
   * Récupérer une facture par référence
   */
  async findInvoiceByReference(reference: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { reference },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
            items: {
              include: {
                variant: {
                  include: {
                    product: true,
                  },
                },
              },
            },
            address: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Facture introuvable');
    }

    return invoice;
  }

  /**
   * CLIENT : Factures d'un utilisateur
   */
  async findInvoicesForUser(userId: number) {
    return this.prisma.invoice.findMany({
      where: {
        order: {
          userId: userId,
        },
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                variant: {
                  include: {
                    product: true,
                  },
                },
              },
            },
            address: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}