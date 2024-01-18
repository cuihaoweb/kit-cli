<script>
</script>

<header class="header-root-wrapper row justify-center" on:click={handleClick}>
    header
</header>

<style lang="less">
    .header-root-wrapper {
        position: sticky;
        top: 0;
        left: 0;
        height: 80px;
        background: #fff;
        z-index: 1;

        .nav-item {
            color: #999;
            text-decoration: none;

            &:nth-of-type(n + 2) {
                margin-left: 10px;
            }

            &:hover,
            &.active {
                color: #333;
            }
        }
    }
</style>