<script>
    export let className = '';
    let covering = false;
</script>

<div class={`tooltip-root-wrapper ${className}`}>
    {#if covering && $$slots.tip}
        <div class="tip-wrapper flex flex-col items-center">
            <div class="slot-wrapper">
                <slot name="tip"></slot>
            </div>
            <div class="triangle"></div>
        </div>
    {/if}

    <div
        class="content-wrapper"
        on:mouseover={() => covering = true}
        on:mouseout={() => covering = false}
    >
        <slot></slot>
    </div>
</div>

<style lang="scss">
    $bg: #fcfcfc;

    .tooltip-root-wrapper {
        position: relative;
        cursor: pointer;

        .tip-wrapper {
            position: absolute;
            top: 6px;
            left: 50%;
            min-width: 120px;
            transform: translate3d(-50%, -100%, 0);

            .slot-wrapper {
                padding: 6px;
                background-color: $bg;
            }

            .triangle {
                width: 0;
                height: 0;
                margin-top: -3px;
                border: 9px solid transparent;
                border-top: 9px solid $bg;
            }
        }
    }
</style>