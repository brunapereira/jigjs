import {EventPublisher, EventSubscriber} from "../../../../core/src/event-bus";
import {CART_SERVICE_EVENTS, Pokemon, PokemonItem} from "../models/models";

class CartRepository {
    private lsKey = 'cart-service-items';

    all(): PokemonItem[] {
        return JSON.parse(localStorage.getItem(this.lsKey) || '[]');
    }

    byId(number: string) {
        const item = this.byIdInList(number, this.all());

        if (item) {
            return {...item};
        }
    }
    save(item: PokemonItem) {
        const list = this.all();
        const storedItem = this.byIdInList(item.number, list);

        if (storedItem) {
            const storedIndex = list.indexOf(storedItem);
            list[storedIndex] = item;
        } else {
            list.push(item);
        }

        this.saveAll(list);
    }

    totalItems() {
        return this.all()
            .reduce((acc: number, pokemonItem) => acc + pokemonItem.total, 0)
    }

    delete(toBeDeleted: PokemonItem) {
        this.saveAll(this.all().filter((item) => item.number !== toBeDeleted.number))
    }

    private saveAll(newPokemonList) {
        localStorage.setItem(this.lsKey, JSON.stringify(newPokemonList));
    }

    private byIdInList(number: string, list: PokemonItem[]) {
        return list.find((item) => item.number === number);
    }
}

export class CartService {
    private readonly cartRepository;
    constructor(private readonly publishEvent: EventPublisher, cartRepository: CartRepository) {
        this.cartRepository = cartRepository;
        this.publishCart();
    }

    addToCart(pokemon: Pokemon) {
        const cartItem = this.getItemOrEmptyItem(pokemon);

        cartItem.total++;
        this.cartRepository.save(cartItem);

        this.publishCart();
    }

    deleteItem(itemToBeDeleted: PokemonItem) {
        this.cartRepository.delete(itemToBeDeleted);
        this.publishCart();
    }

    updateItem(updateItem: PokemonItem) {
        this.cartRepository.save(updateItem);
        this.publishCart();
    }

    publishCart() {
        this.publishEvent(CART_SERVICE_EVENTS.CART_ITEMS, {
            items: this.cartRepository.all(),
            total: this.cartRepository.totalItems()
        })
    }

    private getItemOrEmptyItem(pokemon: Pokemon): PokemonItem {
        return this.cartRepository.byId(pokemon.number) || {...pokemon, total: 0};
    }
}

export const registerCartService = (publishEvent: EventPublisher, subscribeToEvent: EventSubscriber) => {
    const cartService = new CartService(publishEvent, new CartRepository());

    subscribeToEvent(CART_SERVICE_EVENTS.ADD_TO_CART, (payload: Pokemon) => {
        cartService.addToCart(payload);
    });

    subscribeToEvent(CART_SERVICE_EVENTS.ASK_FOR_ITEMS, () => {
        cartService.publishCart();
    });

    subscribeToEvent(CART_SERVICE_EVENTS.UPDATE_ITEM, (updateItem: PokemonItem) => {
        cartService.updateItem(updateItem);
    });

    subscribeToEvent(CART_SERVICE_EVENTS.DELETE_ITEM, (itemToBeDeleted: PokemonItem) => {
        cartService.deleteItem(itemToBeDeleted);
    });
}
