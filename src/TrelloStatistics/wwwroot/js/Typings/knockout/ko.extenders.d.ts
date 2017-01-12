/// <reference path="knockout.d.ts" />

interface KnockoutExtenders {
    required<T>(target: KnockoutObservable<any>, option: any): KnockoutObservable<any>;
    numeric<T>(target: KnockoutObservable<any>, option: any): KnockoutObservable<any>;
}