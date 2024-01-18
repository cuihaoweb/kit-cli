<script>
    import Tooltip from '@/components/Tooltip.svelte';
</script>

<footer class="footer-root-wrapper">
    <dl class="section">
        <dt>project</dt>
        <dd><a href="#1" target="_blank">item</a></dd>
        <dd><a href="#1" target="_blank">item</a></dd>
        <dd><a href="#1" target="_blank">item</a></dd>
    </dl>

    <div class="flex-placeholder"></div>

    <div class="circle-wrapper">
        <Tooltip className="circle-box">
            <img class="circle-img" alt="wechat"/>
            <p slot="tip">tip</p>
        </Tooltip>
        <Tooltip className="circle-box">
            <img class="circle-img" alt="wechat"/>
            <p slot="tip">tip</p>
        </Tooltip>
    </div>
</footer>

<style lang="less">
    .footer-root-wrapper {
        padding: 50px 160px;
        background-color: #000;
        display: flex;
        flex-flow: row nowrap;
        color: #fff;

        .section {
            &:nth-of-type(n + 2) {
                margin-left: 168px;
            }

            dt {
                font-size: 16px;
                font-weight: 700;
                margin-bottom: 12px;
            }
        }

        .flex-placeholder {
            flex: 1;
        }

        .circle-wrapper {
            display: flex;
            flex-flow: row nowrap;
            align-items: center;

            :global(.circle-box) {
                margin-left: 15px;
                

                :global(.circle-img) {
                    display: block;
                    width: 37px;
                    height: 37px;
                    border-radius: 50%;
                    background-color: #fff;
                }

                :global(.tip-img) {
                    max-width: unset;
                    width: 200px;
                    height: 200px;
                }
            }
        }
    }
</style>