<script>
    import Header from '@/modules/Header.svelte';
    import Footer from '@/modules/Footer.svelte';
</script>

<div id="page-root" class="page-root-wrapper">
    <Header></Header>
    <Footer></Footer>
</div>

<style lang="less">
    .page-root-wrapper {
        width: 100%;
        height: 100%;
        overflow-y: scroll;
        overflow-x: hidden;
    }
</style>